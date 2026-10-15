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

export function useLogout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clear)

  return async () => {
    try {
      await logout()
    } catch {
      // Ignorar errores: si el token ya expiró o fue revocado, el logout
      // local es lo importante.
    } finally {
      clearAuth()
      navigate('/login', { replace: true })
    }
  }
}
