import { apiClient } from '@/lib/apiClient'
import type { Service } from '@/lib/api/types'

export async function fetchServices(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>('/services')
  return data
}
