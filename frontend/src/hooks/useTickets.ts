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
  resolveTicket,
  putPendingTicket,
  getTeamDashboard,
  getAdminDashboard,
} from '@/lib/api/tickets'
import { useIsSessionValid } from '@/hooks/useSessionValidity'
import { useRealtimeConnectionState } from '@/hooks/useRealtimeTicketHub'

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

/**
 * Fallback polling cadence for the group queue, used ONLY while the realtime
 * connection is down.
 *
 * BUG-032 / H-32: the Kanban used to poll every 1500 ms (40 requests/minute) while
 * `GET /tickets/by-group` is protected by the `Expensive` policy, whose production
 * token bucket allows 20 requests/minute per user (20 tokens, 1 token every 3 s).
 * The client asked for twice the sustainable rate, emptied the bucket and the server
 * answered 429 — a correct answer to an incorrect client. 30 s keeps a degraded
 * board usable while staying far below the quota.
 */
export const QUEUE_FALLBACK_POLL_MS = 30_000

export interface GroupQueueQueryOptions {
  /**
   * Overrides the fallback polling cadence. Ignored while SignalR is connected.
   * Pass `false` to disable the fallback entirely.
   */
  fallbackIntervalMs?: number | false
}

export function useGroupQueueQuery(
  groupId: number | null,
  options: GroupQueueQueryOptions = {},
) {
  const connectionState = useRealtimeConnectionState()
  const sessionValid = useIsSessionValid()
  const fallbackIntervalMs = options.fallbackIntervalMs ?? QUEUE_FALLBACK_POLL_MS

  return useQuery({
    queryKey: queryKeys.tickets.byGroupQueue(groupId ?? 0),
    queryFn: () => listGroupQueue(groupId as number),
    // Without a usable session every request would come back 401: the query stays
    // disabled instead of burning the quota on doomed calls.
    enabled: groupId != null && groupId > 0 && sessionValid,
    staleTime: 60_000,
    /**
     * SignalR is the primary channel: while it is connected the board is updated by
     * the hub events and polling is switched off completely. When realtime is down
     * the query degrades to a slow poll so the board still refreshes.
     *
     * The function form is re-evaluated by TanStack Query on every render, so the
     * closure always sees the current connection state.
     */
    refetchInterval: () => {
      if (!sessionValid) return false
      if (connectionState === 'connected') return false
      if (fallbackIntervalMs === false) return false
      return fallbackIntervalMs
    },
    // Never poll a background tab: the data is refreshed when the user comes back.
    refetchIntervalInBackground: false,
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

/**
 * Resolves a ticket atomically (BUG-031 / H-31): one request writes the solution and
 * moves the ticket to its resolved state, so the UI never has to chain two calls.
 */
export function useResolveTicketMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, content }: { ticketId: number; content: string }) =>
      resolveTicket(ticketId, content),
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

export function usePutPendingMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ticketId, reasonId, comment }: { ticketId: number; reasonId: number; comment: string }) =>
      putPendingTicket(ticketId, { reasonId, comment }),
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

export function useTeamDashboardQuery(groupId: number | null) {
  return useQuery({
    queryKey: ['groups', 'dashboard', groupId],
    queryFn: () => getTeamDashboard(groupId as number),
    enabled: groupId != null && groupId > 0,
  })
}

export function useAdminDashboardQuery() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
  })
}
