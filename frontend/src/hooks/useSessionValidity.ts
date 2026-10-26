import { useEffect, useMemo, useReducer } from 'react'

import { getTokenExpiryMs, isSessionValid } from '@/lib/auth/token'
import { useAuthStore } from '@/store/authStore'

/**
 * Tells whether the current session is still usable.
 *
 * BUG-032 / H-32: the API's JWT expires after `Jwt:ExpiryMinutes` (60 by default).
 * Until now the client kept sending requests with an expired token, which the server
 * answered with 401 and the axios interceptor turned into "session cleared" — the
 * 401 cascade reported together with the 429 bursts.
 *
 * The hook re-renders exactly when the token expires, so the UI can react (redirect
 * to the login screen, stop polling) instead of discovering the expiry through a
 * failed request.
 */
export function useIsSessionValid(): boolean {
  const token = useAuthStore((state) => state.accessToken ?? state.token)
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0)

  const expiresAt = useMemo(() => getTokenExpiryMs(token), [token])

  useEffect(() => {
    if (expiresAt === null) return

    const remaining = expiresAt - Date.now()
    // Already expired: the render below already reflects it.
    if (remaining <= 0) return

    const timer = setTimeout(() => forceUpdate(), remaining + 100)
    return () => clearTimeout(timer)
  }, [expiresAt])

  return isSessionValid(token)
}
