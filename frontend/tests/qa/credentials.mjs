import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// Fixture accounts keep their canonical names in the E2E suite.
const ALIASES = {
  TECH1: ['E2E_TECH_PASSWORD'],
  TECH2: ['E2E_TECH2_PASSWORD'],
  USER1: ['E2E_REQUESTER_PASSWORD'],
  ADMIN_TEST: ['E2E_ADMIN_PASSWORD'],
}

/**
 * Test-account password lookup. Credentials never live in the repository:
 * they come from CRED_<USER> environment variables or the untracked
 * .env.local file at the repository root.
 */
export function getCred(user) {
  const key = `CRED_${String(user).toUpperCase()}`
  if (process.env[key]) return process.env[key]

  for (const alias of ALIASES[String(user).toUpperCase()] ?? []) {
    if (process.env[alias]) return process.env[alias]
  }

  const candidates = [
    '.env.local',
    path.resolve(HERE, '../../../.env.local'),
    path.resolve(HERE, '../../.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ]

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue
      const text = fs.readFileSync(candidate, 'utf8')
      const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
      if (match) return match[1].trim()
    } catch {
      // keep looking
    }
  }

  return ''
}

export function requireCred(user) {
  const value = getCred(user)
  if (!value) {
    throw new Error(
      `Falta la credencial de ${user}. Definí CRED_${String(user).toUpperCase()} en el entorno o en .env.local.`,
    )
  }
  return value
}
