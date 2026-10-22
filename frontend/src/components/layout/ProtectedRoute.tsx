import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useIsSessionValid } from '@/hooks/useSessionValidity'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const sessionValid = useIsSessionValid()
  const location = useLocation()

  // BUG-032 / H-32: a missing OR expired token redirects to the login screen.
  // Checking the expiry up front avoids the cascade of 401s the API used to answer
  // while the board kept polling with a dead token.
  if (!sessionValid) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  return <>{children}</>
}
