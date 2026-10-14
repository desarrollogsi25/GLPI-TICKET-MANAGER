import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/lib/api/queryKeys'
import {
  createTicket,
  getTicket,
  listTickets,
  updateTicketStatus,
  listGroups,
  listChannels,
  listGroupQueue,
  claimTicket,
  createSolution,
} from '@/lib/api/tickets'
import type { CreateTicketInput } from '@/lib/api/types'

/** The API caps `limit` at 100; the board and table filter client-side. */
export const TICKETS_PAGE_LIMIT = 100

export function useTicketsQuery(assigneeId: number | null) {
  return useQuery({
    queryKey: queryKeys.tickets.byAssignee(assigneeId ?? 0),
    queryFn: () =>
      listTickets({
        assigneeId: assigneeId as number,
        limit: TICKETS_PAGE_LIMIT,
        offset: 0,
      }),
    enabled: assigneeId != null,
  })
}

export function useTicketQuery(ticketId: number) {
  return useQuery({
    queryKey: queryKeys.tickets.detail(ticketId),
    queryFn: () => getTicket(ticketId),
    enabled: Number.isInteger(ticketId) && ticketId > 0,
  })
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTicketInput) => createTicket(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats }),
      ])
    },
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
  })
}

export function useChannelsQuery() {
  return useQuery({
    queryKey: queryKeys.channels.all,
    queryFn: listChannels,
  })
}

export function useGroupQueueQuery(groupId: number | null) {
  return useQuery({
    queryKey: queryKeys.tickets.byGroupQueue(groupId ?? 0),
    queryFn: () => listGroupQueue(groupId as number),
    enabled: groupId != null && groupId > 0,
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