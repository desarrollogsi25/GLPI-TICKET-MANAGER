import { chromium, type FullConfig } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const AUTH_FILE = 'tests/e2e/.auth/tech1.json'

export default async function globalSetup(_config: FullConfig) {
  // Reset only the named E2E fixtures before the suite so tests do not depend
  // on whether a previous run left ticket #11/#57/#70 assigned or resolved.
  const projectRoot = resolve(process.cwd(), '..')
  const envPath = resolve(projectRoot, '.env')
  const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const readEnv = (name: string, fallback?: string) => {
    const value = process.env[name] ?? envContent.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim() ?? fallback
    if (!value) throw new Error(`Configura ${name} en el entorno E2E.`)
    return value
  }

  if (!process.env.CI) try {
    execFileSync(
      'docker',
      [
        'exec', '-i', 'glpi-db', 'mariadb',
        `-u${readEnv('MARIADB_USER', 'glpi')}`,
        `-p${readEnv('MARIADB_PASSWORD')}`,
        readEnv('MARIADB_DATABASE', 'glpi'),
      ],
      {
        cwd: projectRoot,
        input: readFileSync(resolve(projectRoot, 'scripts/seed-e2e.sql')),
        stdio: ['pipe', 'inherit', 'inherit'],
      },
    )
    // SQL contains no credentials. Provision bcrypt hashes via environment.
    execFileSync('bash', ['scripts/seed-e2e.sh'], { cwd: projectRoot, stdio: 'inherit' })
    console.log('[e2e] GLPI fixtures reset and credentials provisioned from environment')

    try {
      execFileSync(
        'docker',
        [
          'exec', '-i', 'glpi-app-db', 'psql',
          '-U', 'app', '-d', 'glpi_ticket_manager',
          '-c', 'DELETE FROM user_preferences WHERE user_id IN (7, 18); DELETE FROM revoked_tokens WHERE user_id IN (7, 18);',
        ],
        { stdio: ['ignore', 'inherit', 'inherit'] }
      )
      console.log('[e2e] app-db preferences reset for test users')
    } catch {
      // ignore if app-db container not running with that name
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // CI runners can have fixtures injected by their own service setup.
      console.warn('[e2e] docker CLI unavailable; relying on externally seeded fixtures')
    } else {
      throw error
    }
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto('http://localhost:5173/login')
  await page.fill('input[name="username"]', 'tech1')
  await page.fill('input[name="password"]', readEnv('E2E_TECH_PASSWORD'))
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(kanban|dashboard|tickets|queue)/, { timeout: 60000 })

  // Ensure storage is persisted.
  mkdirSync(dirname(AUTH_FILE), { recursive: true })
  await context.storageState({ path: AUTH_FILE })
  await context.close()
  await browser.close()
}
