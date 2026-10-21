import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/queryKeys'
import {
  getTicket,
  listTickets,
  updateTicketStatus,
  listGroups,
  listChannels,
  listGroupQueue,
  claimTicket,
  createSolution,
  reopenTicket,
} from '@/lib/api/tickets'

/** The API caps `limit` at 100; the board and table filter client-side. */
export const TICKETS_PAGE_LIMIT = 100

export interface TicketFilters {
  assigneeId?: number | null
  serviceId?: number | null
  startDate?: string | null
  endDate?: string | null
  enabled?: boolean
}

export function useTicketsQuery(filtersOrAssigneeId: number | null | TicketFilters) {
  const filters: TicketFilters =
    typeof filtersOrAssigneeId === 'object' && filtersOrAssigneeId !== null
      ? filtersOrAssigneeId
      : { assigneeId: filtersOrAssigneeId }

  const { assigneeId, serviceId, startDate, endDate, enabled = true } = filters
  const hasFilter = assigneeId != null || serviceId != null

  // Any extra filter (service or date range) switches the cache key to the generic list
  // key so date ranges and services never collide with the plain per-assignee entry.
  const usesListKey = serviceId != null || startDate != null || endDate != null

  const queryKey = usesListKey
    ? queryKeys.tickets.list(filters)
    : queryKeys.tickets.byAssignee(assigneeId ?? 0)

  return useQuery({
    queryKey,
    queryFn: () =>
      listTickets({
        assigneeId: assigneeId ?? undefined,
        serviceId: serviceId ?? undefined,
        startDate: startDate ?? undefined,
        endDate: endDate ?? undefined,
        limit: TICKETS_PAGE_LIMIT,
        offset: 0,
      }),
    enabled: hasFilter && enabled,
  })
}

export function useTicketQuery(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: () => getTicket(ticketId),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  })
}

export function useUpdateTicketStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: number; status: number }) =>
      updateTicketStatus(ticketId, status),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(variables.ticketId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useGroupsQuery() {
  return useQuery({
    queryKey: queryKeys.groups.all,
    queryFn: listGroups,
    staleTime: 5 * 60_000,
  })
}

export function useChannelsQuery() {
  return useQuery({
    queryKey: queryKeys.channels.all,
    queryFn: listChannels,
    staleTime: 5 * 60_000,
  })
}

export function useGroupQueueQuery(groupId: number | null, refetchInterval?: number) {
  return useQuery({
    queryKey: queryKeys.tickets.byGroupQueue(groupId ?? 0),
    queryFn: () => listGroupQueue(groupId as number),
    enabled: groupId != null && groupId > 0,
    staleTime: 60_000,
    refetchInterval,
  })
}

export function useClaimTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketId: number) => claimTicket(ticketId),
    onSuccess: async (_data, ticketId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: ['tickets', 'group-queue'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(ticketId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useCreateSolutionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: number; content: string }) =>
      createSolution(ticketId, content),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(variables.ticketId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}

export function useReopenTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: number; reason?: string }) =>
      reopenTicket(ticketId, reason),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: ['tickets', 'group-queue'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.detail(variables.ticketId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
  })
}
