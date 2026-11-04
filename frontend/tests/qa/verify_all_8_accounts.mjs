import fs from 'node:fs'

const API_URL = 'http://localhost:8080/api/auth/login'

function getCred(user) {
  const key = `CRED_${user.toUpperCase()}`
  if (process.env[key]) return process.env[key]
  for (const candidate of ['.env.local', '../.env.local', '../../.env.local']) {
    try {
      if (fs.existsSync(candidate)) {
        const text = fs.readFileSync(candidate, 'utf8')
        const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'))
        if (match) return match[1].trim()
      }
    } catch {}
  }
  return ''
}

const ACCOUNTS = [
  { username: 'glpi', expectedRole: 'admin' },
  { username: 'admin_test', expectedRole: 'admin' },
  { username: 'lider_dev', expectedRole: 'supervisor' },
  { username: 'lider_bi', expectedRole: 'supervisor' },
  { username: 'lider_sd', expectedRole: 'supervisor' },
  { username: 'tech_dev', expectedRole: 'technician' },
  { username: 'tech_bi', expectedRole: 'technician' },
  { username: 'tech_sd', expectedRole: 'technician' },
  { username: 'user_test', expectedRole: 'solicitante' },
]

async function verify() {
  console.log('================================================================')
  console.log('AUDITORÍA DE AUTENTICACIÓN Y ROLES DE LAS CUENTAS OFICIALES')
  console.log('================================================================\n')

  let allPassed = true

  for (const acc of ACCOUNTS) {
    const password = getCred(acc.username)
    if (!password) {
      console.log(`[-] ${acc.username}: ⚠️ Contraseña no encontrada en .env.local`)
      allPassed = false
      continue
    }

    let tmStatus = 'N/A'
    let tmRole = 'none'
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: acc.username, password }),
      })
      if (res.ok) {
        const data = await res.json()
        tmStatus = `OK (HTTP 200)`
        tmRole = data.user?.role || 'authenticated'
      } else {
        tmStatus = `RECHAZADO (HTTP ${res.status})`
      }
    } catch (e) {
      tmStatus = `ERROR: ${e.message}`
    }

    const matchesRole = tmRole.toLowerCase() === acc.expectedRole.toLowerCase() || (acc.expectedRole === 'admin' && tmRole === 'admin')
    const passed = tmStatus.startsWith('OK') && matchesRole

    console.log(`[CUENTA: ${acc.username.padEnd(12)}] -> ${tmStatus} | Rol devuelto: ${tmRole.padEnd(12)} (Esperado: ${acc.expectedRole}) | Cumple: ${passed ? '✅' : '❌'}`)

    if (!passed) allPassed = false
  }

  console.log('\n================================================================')
  console.log(`RESULTADO FINAL AUDITORÍA DE CUENTAS: ${allPassed ? '100% PASS 🟢' : 'FALLO 🔴'}`)
  console.log('================================================================')

  if (!allPassed) process.exit(1)
}

verify().catch((err) => {
  console.error(err)
  process.exit(1)
})
