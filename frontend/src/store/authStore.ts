import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UserProfile } from '@/lib/api/types'

interface AuthState {
  token: string | null
  accessToken: string | null
  user: UserProfile | null
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
      setSession: (token, user) => set({ token, accessToken: token, user }),
      clear: () => set({ token: null, accessToken: null, user: null }),
      logout: () => set({ token: null, accessToken: null, user: null }),
    }),
    { name: 'glpi-ticket-manager.auth' },
  ),
)
