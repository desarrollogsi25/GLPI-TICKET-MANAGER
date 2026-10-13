import { apiClient } from '@/lib/apiClient'
import type { DashboardStats } from '@/lib/api/types'

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats')
  return data
}
