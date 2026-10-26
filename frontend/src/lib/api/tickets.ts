import { apiClient } from '@/lib/apiClient'
import type {
  PagedResult,
  TicketSummary,
  TeamMember,
  GroupDashboard,
  GroupSummary,
  CreateTicketRequest,
  CreateTicketResponse,
} from '@/lib/api/types'

export interface TicketListParams {
  assigneeId?: number
  serviceId?: number
  /** UTC lower bound (inclusive) over the ticket creation date, as `yyyy-MM-dd`. */
  startDate?: string
  /** UTC upper bound (inclusive) over the ticket creation date, as `yyyy-MM-dd`. */
  endDate?: string
  limit?: number
  offset?: number
}

export async function listTickets(params: TicketListParams): Promise<PagedResult<TicketSummary>> {
  const { data } = await apiClient.get<PagedResult<TicketSummary>>('/tickets', { params })
  return data
}

export async function getTicket(id: number): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.get(`/tickets/${id}`)
  return data
}

export async function updateTicketStatus(id: number, status: number): Promise<void> {
  await apiClient.patch(`/tickets/${id}/status`, { status })
}

export async function listGroups(): Promise<import('@/lib/api/types').Group[]> {
  const { data } = await apiClient.get('/groups')
  return data
}

export async function listChannels(): Promise<import('@/lib/api/types').Channel[]> {
  const { data } = await apiClient.get('/channels')
  return data
}

export async function listGroupQueue(groupId: number, limit = 20, offset = 0): Promise<PagedResult<TicketSummary>> {
  const { data } = await apiClient.get<PagedResult<TicketSummary>>('/tickets/by-group', {
    params: { groupId, unassigned: true, limit, offset },
  })
  return data
}

export async function claimTicket(id: number): Promise<TicketSummary> {
  const { data } = await apiClient.post(`/tickets/${id}/claim`)
  return data
}

export async function createSolution(id: number, content: string): Promise<{ id: number }> {
  const { data } = await apiClient.post(`/tickets/${id}/solutions`, { content })
  return data
}

/**
 * Resolves a ticket in a single call (BUG-031 / H-31).
 *
 * The API writes the solution, drives the ticket to its resolved state and emits a
 * single realtime event. The previous two-call sequence (POST /solutions followed by
 * PATCH /status) answered 400/422 for the same technician action.
 */
export async function resolveTicket(id: number, content: string): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.post(`/tickets/${id}/resolve`, { content })
  return data
}

export async function reopenTicket(id: number, reason?: string): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.post(`/tickets/${id}/reopen`, reason ? { reason } : {})
  return data
}

export interface PutPendingRequest {
  reasonId: number
  comment: string
}

export async function putPendingTicket(id: number, payload: PutPendingRequest): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.post(`/tickets/${id}/pending`, payload)
  return data
}

export async function createTicket(payload: CreateTicketRequest): Promise<CreateTicketResponse> {
  const { data } = await apiClient.post<CreateTicketResponse>('/tickets', payload)
  return data
}

export async function getTeamDashboard(groupId: number): Promise<GroupDashboard> {
  const { data } = await apiClient.get<GroupDashboard | TeamMember[]>(`/groups/${groupId}/dashboard`)
  if (Array.isArray(data)) {
    return {
      totalTickets: 0,
      queuedTickets: 0,
      assignedTickets: 0,
      inProgressTickets: 0,
      pendingTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      technicians: data,
    }
  }
  return data
}

export async function getAdminDashboard(): Promise<GroupSummary[]> {
  const { data } = await apiClient.get<GroupSummary[]>('/admin/groups-summary')
  return data
}