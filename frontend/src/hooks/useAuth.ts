import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchCurrentUser, login } from '@/lib/api/auth'
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
