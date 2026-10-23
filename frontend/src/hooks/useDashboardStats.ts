import { useQuery } from '@tanstack/react-query'

import { fetchDashboardStats } from '@/lib/api/dashboard'
import { queryKeys } from '@/lib/api/queryKeys'
import { useIsSessionValid } from '@/hooks/useSessionValidity'

export function useDashboardStatsQuery() {
  const sessionValid = useIsSessionValid()
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats,
    enabled: sessionValid,
    staleTime: 60_000,
  })
}
