import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import type { AppRole } from '@/lib/api/types'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteWithRoleProps {
  allowedRoles: AppRole[]
  fallbackPath?: string
  children: ReactNode
}

/**
 * Route guard that restricts access based on user role.
 * For example, requesters ('solicitante') cannot access the Kanban or Queue,
 * and are redirected to their ticket list ('/tickets').
 */
export function ProtectedRouteWithRole({
  allowedRoles,
  fallbackPath = '/tickets',
  children,
}: ProtectedRouteWithRoleProps) {
  const role = useAuthStore((state) => state.role)

  if (!allowedRoles.includes(role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
