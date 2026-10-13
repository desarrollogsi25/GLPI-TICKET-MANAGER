import { useQuery } from '@tanstack/react-query'

import { fetchDashboardStats } from '@/lib/api/dashboard'
import { queryKeys } from '@/lib/api/queryKeys'

export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchDashboardStats,
  })
}
