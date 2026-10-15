import { useQuery } from '@tanstack/react-query'

import { fetchServices } from '@/lib/api/services'
import { queryKeys } from '@/lib/api/queryKeys'

export function useServicesQuery() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: fetchServices,
  })
}
