import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/store/authStore'
import type { AppRole } from '@/lib/api/types'

interface ProtectedRouteWithRoleProps {
  children: ReactNode
  allowedRoles: AppRole[]
  redirectTo?: string
}

export function ProtectedRouteWithRole({
  children,
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteWithRoleProps) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  const { role } = useRole()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
