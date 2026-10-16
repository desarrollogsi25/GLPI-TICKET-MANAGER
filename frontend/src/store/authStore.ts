import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { AppRole, UserProfile } from '@/lib/api/types'

function decodeRoleFromToken(token: string): AppRole {
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(base64))
      const r = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])?.toLowerCase()
      if (r === 'admin' || r === 'supervisor' || r === 'technician') {
        return r
      }
    }
  } catch {
    // ignore parse error and fallback
  }
  return 'technician'
}

interface AuthState {
  token: string | null
  accessToken: string | null
  user: UserProfile | null
  role: AppRole
  setSession: (token: string, user: UserProfile) => void
  clear: () => void
  logout: () => void
}

/**
 * Session state for the frontend. The token is the API's own JWT,
 * never a GLPI session token.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      accessToken: null,
      user: null,
      role: 'technician',
      setSession: (token, user) => {
        const role = user.role ?? decodeRoleFromToken(token)
        const userWithRole = { ...user, role }
        set({ token, accessToken: token, user: userWithRole, role })
      },
      clear: () => set({ token: null, accessToken: null, user: null, role: 'technician' }),
      logout: () => set({ token: null, accessToken: null, user: null, role: 'technician' }),
    }),
    { name: 'glpi-ticket-manager.auth' },
  ),
)
