import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchPreferences, updatePreferences } from '@/lib/api/preferences'
import { queryKeys } from '@/lib/api/queryKeys'
import { useAuthStore } from '@/store/authStore'

export function usePreferencesQuery() {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.preferences.all,
    queryFn: fetchPreferences,
    enabled: Boolean(token),
  })
}

export function useUpdatePreferencesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prefs: object) => updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.preferences.all })
    },
  })
}
