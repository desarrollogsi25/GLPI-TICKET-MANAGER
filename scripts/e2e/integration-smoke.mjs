import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'
import { assertDisposableFixture, runFixtureCommand, runFixtureSql } from './guard.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/** Restore the real SQL007 regression without importing any historical database. */
export async function verifyWebhookMigration(env) {
  assertDisposableFixture(env)
  for (const [source, target] of [
    ['scripts/test-glpi-007.sh', '/tmp/e2e007-test.sh'],
    ['db/glpi/007_glpi_webhook_config.sql', '/tmp/e2e007-migration.sql'],
  ]) {
    runFixtureCommand('glpi-db', ['sh', '-c', `cat > ${target}`], env, undefined,
      readFileSync(resolve(root, source), 'utf8').replace(/\r\n/g, '\n'))
  }
  // Schema only, from this fresh fixture. The child database remains inside the
  // verified tmpfs container and disappears with the fixture's normal cleanup.
  runFixtureCommand('glpi-db', ['sh', '-c',
    `set -e; MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb-dump -uroot --no-data --skip-triggers --skip-comments glpi > /tmp/e2e007-schema.sql;
     MYSQL_PWD="$MARIADB_ROOT_PASSWORD" mariadb-dump -uroot --no-create-info --skip-triggers --skip-comments --compact --where="context='core' AND name='version'" glpi glpi_configs >> /tmp/e2e007-schema.sql`], env)
  // Full-schema digests can exceed the guard's per-command timeout on Docker
  // Desktop. Keep that timeout intact; poll a bounded, fixture-local process.
  runFixtureCommand('glpi-db', ['sh', '-c',
    '(MYSQL_PWD="$MARIADB_ROOT_PASSWORD" bash /tmp/e2e007-test.sh /tmp/e2e007-migration.sql /tmp/e2e007-schema.sql; printf "%s" "$?" > /tmp/e2e007-exit) </dev/null >/tmp/e2e007-result 2>&1 &'], env)
  const deadline = Date.now() + 300_000
  while (Date.now() < deadline) {
    const result = runFixtureCommand('glpi-db', ['sh', '-c',
      'if test -f /tmp/e2e007-exit; then if test "$(cat /tmp/e2e007-exit)" = 0 && grep -q "007 regression passed" /tmp/e2e007-result; then printf PASS; else printf FAIL; fi; else printf RUNNING; fi'], env).trim()
    if (result === 'PASS') return
    if (result !== 'RUNNING') throw new Error('SQL007 regression did not confirm success')
    await delay(1000)
  }
  throw new Error('SQL007 regression exceeded its fixture-local deadline')
}

/** Two independent API processes, one shared PostgreSQL, then restart/replay. */
export function verifyWebhookReplicas(env, webhookSecret) {
  assertDisposableFixture(env)
  if (!env.E2E_ADMIN_PASSWORD) throw new Error('Fixture administrator credentials are required')
  let publicKey
  const start = () => runFixtureCommand('api', ['sh', '-c',
    'ASPNETCORE_URLS=http://+:8082 dotnet GlpiTicketManager.Api.dll </dev/null >/tmp/e2e-replica.log 2>&1 & echo $! > /tmp/e2e-replica.pid'], env)
  const stop = () => runFixtureCommand('api', ['sh', '-c',
    'kill -TERM "$(cat /tmp/e2e-replica.pid)"; sleep 1'], env)
  const replay = () => {
    // Send the signing secret over stdin to the fixture process, never argv/logs.
    const script = `
      const { createHmac } = require('node:crypto');
      const secret = ${JSON.stringify(webhookSecret)};
      const credentials = ${JSON.stringify({ username: env.E2E_ADMIN_USERNAME ?? 'admin_test', password: env.E2E_ADMIN_PASSWORD })};
      (async () => {
        let ready = false;
        for (let attempt = 0; attempt < 120; attempt++) {
          try { ready = (await fetch('http://api:8082/health/ready', { signal: AbortSignal.timeout(2000) })).ok; } catch {}
          if (ready) break;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        if (!ready) throw new Error('Secondary fixture API did not become ready');
        const login = await fetch('http://api:8080/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
          signal: AbortSignal.timeout(10000),
        });
        if (!login.ok) throw new Error('Synthetic administrator login failed');
        const token = (await login.json()).accessToken;
        const keys = await Promise.all(Array.from({ length: 8 }, async (_, index) => {
          const response = await fetch('http://api:' + (index % 2 ? 8082 : 8080) + '/api/notifications/push/vapid-public-key', {
            headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) throw new Error('VAPID key unavailable');
          return (await response.json()).publicKey;
        }));
        if (!keys[0] || new Set(keys).size !== 1) throw new Error('VAPID keys diverged between API processes');
        const body = JSON.stringify({ ticketId: 970 });
        const timestamp = String(Math.floor(Date.now() / 1000));
        const signature = createHmac('sha256', secret).update(body + timestamp).digest('hex');
        const statuses = await Promise.all(Array.from({ length: 12 }, async (_, index) => {
          const response = await fetch('http://api:' + (index % 2 ? 8082 : 8080) + '/api/integrations/glpi/ticket-created', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-GLPI-timestamp': timestamp, 'X-GLPI-signature': signature },
            body, signal: AbortSignal.timeout(15000),
          });
          return response.status;
        }));
        if (statuses.some(status => status !== 200)) throw new Error('A signed replay was rejected');
        console.log(JSON.stringify({ passed: true, vapidPublicKey: keys[0] }));
      })().catch(() => { console.error('Fixture replica replay failed'); process.exitCode = 1; });
    `
    const result = runFixtureCommand('frontend', ['node', '-'], env, undefined, script)
    const confirmation = JSON.parse(result)
    if (!confirmation.passed || !confirmation.vapidPublicKey) throw new Error('Replica replay did not confirm success')
    if (publicKey !== undefined && publicKey !== confirmation.vapidPublicKey)
      throw new Error('VAPID public key changed after the secondary API restart')
    publicKey = confirmation.vapidPublicKey
    const rows = runFixtureSql('postgres', `SELECT
      (SELECT COUNT(*) FROM notifications WHERE ticket_id=970 AND user_id=7 AND type='TicketCreated'),
      (SELECT COUNT(*) FROM glpi_ticket_created_notification_keys WHERE ticket_id=970 AND user_id=7);`, env).trim()
    if (rows !== '1|1') throw new Error('Expected exactly one durable notification and claim after concurrent replay')
  }
  runFixtureSql('mariadb', `INSERT INTO glpi_tickets
    (id, entities_id, name, content, status, type, urgency, impact, priority, date, date_mod, itilcategories_id)
    VALUES (970, 0, 'Synthetic replica replay', 'Exclusive fixture smoke', 1, 1, 3, 3, 3, NOW(), NOW(), 1);
    INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (970, 1, 2);`, env)
  start()
  try {
    replay()
    stop()
    start()
    replay()
  } finally {
    stop()
  }
}
