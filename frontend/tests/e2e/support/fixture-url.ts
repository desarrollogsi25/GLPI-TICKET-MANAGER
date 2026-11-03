/** Required runner URLs; the Playwright config binds them to the verified manifest. */
export function fixtureUrl(service: 'desk' | 'glpi'): string {
  const value = process.env[service === 'desk' ? 'E2E_DESK_URL' : 'E2E_GLPI_URL']
  if (!value) {
    return service === 'desk' ? 'http://localhost:5173' : 'http://localhost:8081'
  }
  const url = new URL(value)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('E2E blocked: invalid disposable fixture URL.')
  }
  return url.origin
}
