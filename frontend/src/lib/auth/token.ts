/**
 * Helpers to inspect the API's own JWT.
 *
 * The frontend never holds a GLPI session token: `authStore` keeps the JWT minted by
 * `POST /api/auth/login` (see `JwtTokenService`, which always sets `exp`).
 *
 * BUG-032 / H-32: the Kanban used to poll `/tickets/by-group` every 1500 ms (40
 * requests/minute) against a policy that allows 20 requests/minute per user, so the
 * server answered 429 and the session degraded into a cascade of 401s. The client now
 * refuses to poll when there is no usable session, which requires knowing whether the
 * token is still alive before the server says so.
 */

interface JwtPayload {
  exp?: number
  [claim: string]: unknown
}

/**
 * Decodes the payload of a JWT. The signature is NOT verified here (the browser has
 * no key); the result is only used to read `exp`.
 */
export function decodeJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload: unknown = JSON.parse(atob(padded))
    return typeof payload === 'object' && payload !== null ? (payload as JwtPayload) : null
  } catch {
    return null
  }
}

/** Absolute expiry of the token in milliseconds since the epoch, or null if unknown. */
export function getTokenExpiryMs(token: string | null | undefined): number | null {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
    return null
  }
  return payload.exp * 1000
}

/**
 * True when the token cannot be used any more.
 *
 * A token that cannot be parsed counts as expired: the API would reject it with 401
 * anyway, so treating it as valid would only delay the inevitable.
 */
export function isTokenExpired(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) return true

  const expiresAt = getTokenExpiryMs(token)
  if (expiresAt === null) return true

  return expiresAt <= now
}

/** True when there is a token the API would still accept. */
export function isSessionValid(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) return false
  return !isTokenExpired(token, now)
}
