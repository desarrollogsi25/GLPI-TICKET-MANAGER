import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { fetchCurrentUser, login, logout } from '@/lib/api/auth'
import { queryKeys } from '@/lib/api/queryKeys'
import { useAuthStore } from '@/store/authStore'

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.accessToken, data.user)
      queryClient.setQueryData(queryKeys.auth.me, data.user)
    },
  })
}

export function useCurrentUserQuery() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    enabled: Boolean(token),
  })
}

async function unregisterPushOnLogout() {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Bound serviceWorker.ready with a 1000ms timeout so logout never hangs if SW is unready/idle
      const swReady = navigator.serviceWorker.ready.catch(() => null)
      const swTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 1000))
      const reg = (await Promise.race([swReady, swTimeout])) as ServiceWorkerRegistration | null

      if (reg?.pushManager) {
        const sub = await reg.pushManager.getSubscription().catch(() => null)
        if (sub) {
          const endpoint = sub.endpoint
          const apiBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? ''
          await fetch(`${apiBase}/api/push/unsubscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint }),
          }).catch(() => {})
          await sub.unsubscribe().catch(() => {})
        }
      }
    }
  } catch {
    // Ignore push cleanup failures so logout always succeeds
  }
}

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clear)
  const queryClient = useQueryClient()

  return async () => {
    try {
      await unregisterPushOnLogout()
      await queryClient.cancelQueries()
      await logout()
    } catch {
      // Ignorar errores: si el token ya expiró o fue revocado, el logout
      // local es lo importante.
    } finally {
      clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
    }
  }
}
