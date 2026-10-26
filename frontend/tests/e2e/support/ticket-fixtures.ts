import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Helpers to provision the dedicated GLPI fixtures used by the E2E specs.
 *
 * The specs run against the real stack (real GLPI 11 + real MariaDB), so a spec that
 * mutates a ticket must restore it before the next run. The reset uses the same
 * MariaDB access path documented in scripts/seed-e2e.sh.
 *
 * When the Docker CLI is not available (CI runs Playwright inside the frontend
 * container) the fixtures are expected to be pre-seeded by scripts/seed-e2e.sh, so the
 * helper only reports that it skipped the reset.
 */

/** Reads the MariaDB password from the environment or from the repository .env file. */
function readMariaDbPassword(): string {
  const fromEnv = process.env.MARIADB_PASSWORD
  if (fromEnv) return fromEnv

  const envPaths = [resolve(process.cwd(), '../.env'), resolve(process.cwd(), '.env')]
  for (const envPath of envPaths) {
    if (!existsSync(envPath)) continue
    const match = readFileSync(envPath, 'utf8').match(/^MARIADB_PASSWORD=(.*)$/m)
    if (match) return match[1].trim()
  }

  return 'VW9Qr7m2XSkGd0tHegGGq3hhrHcD'
}

/**
 * Restores a fixture ticket to "Nuevo / unassigned in the group queue" and removes
 * its solutions and follow-ups, so the spec is idempotent across repeated runs.
 *
 * @param ticketId GLPI ticket id reserved for the calling spec.
 * @param name Ticket name written by the fixture.
 */
export function resetFixtureTicket(ticketId: number, name: string): void {
  // GitHub Actions seeds the fixtures with scripts/seed-e2e.sh before launching
  // Playwright inside the frontend container, which has no Docker CLI.
  if (process.env.CI) return

  const sql = [
    `INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, requesttypes_id, content, urgency, impact, priority, type, global_validation, itilcategories_id)`,
    `VALUES (${ticketId}, 0, '${name}', NOW(), NOW(), 1, 3, 'Fixture E2E para el spec de resolucion', 3, 3, 3, 1, 1, 2)`,
    `ON DUPLICATE KEY UPDATE status = 1, solvedate = NULL, closedate = NULL, date_mod = NOW();`,
    `INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) VALUES (${ticketId}, 1, 2)`,
    `ON DUPLICATE KEY UPDATE groups_id = 1, type = 2;`,
    `DELETE FROM glpi_tickets_users WHERE tickets_id = ${ticketId} AND type = 2;`,
    `DELETE FROM glpi_itilsolutions WHERE itemtype = 'Ticket' AND items_id = ${ticketId};`,
    `DELETE FROM glpi_itilfollowups WHERE itemtype = 'Ticket' AND items_id = ${ticketId};`,
  ].join('\n')

  try {
    execFileSync(
      'docker',
      [
        'compose',
        'exec',
        '-T',
        'glpi-db',
        'mariadb',
        '-u',
        'glpi',
        `-p${readMariaDbPassword()}`,
        'glpi',
        '-e',
        sql,
      ],
      { stdio: 'pipe' },
    )
  } catch (error) {
    // In CI (inside the frontend container) the Docker CLI is not available and the
    // fixture is already pre-seeded by scripts/seed-e2e.sh before the test execution.
    console.warn(
      '[ticket-fixtures] Docker CLI not available in the runner container; relying on the pre-seeded fixture:',
      (error as Error)?.message,
    )
  }
}
