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

export async function listTickets(params: TicketListParams, signal?: AbortSignal): Promise<PagedResult<TicketSummary>> {
  const { data } = await apiClient.get<PagedResult<TicketSummary>>('/tickets', { params, signal })
  return data
}
export async function getTicket(id: number): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.get(`/tickets/${id}`)
  return data
}
export async function updateTicketStatus(id: number, status: number): Promise<void> {
  await apiClient.patch(`/tickets/${id}/status`, { status })
}

export interface PlanTicketRequest {
  requestId: string
  content: string
  startAt: string
  endAt: string
}

export interface PlanTicketResponse { ticketId: number; taskId: number; status: number }

export async function planTicket(id: number, payload: PlanTicketRequest): Promise<PlanTicketResponse> {
  const { data } = await apiClient.post<PlanTicketResponse>(`/tickets/${id}/plan`, payload)
  return data
}

/** Actual GLPI TicketTask (not a synthetic ticket-status event). */
export interface TicketTask {
  id: number
  ticketId: number
  technicianId: number
  content: string
  state: number
  isPrivate: boolean
  startAt: string | null
  endAt: string | null
  durationSeconds: number
}

export async function listTicketTasks(ticketId: number): Promise<TicketTask[]> {
  const { data } = await apiClient.get<TicketTask[]>(`/tickets/${ticketId}/tasks`)
  return data
}

export interface ReplanTicketTaskRequest extends PlanTicketRequest {}

export interface TicketTaskMutationResponse { ticketId: number; taskId: number; ticketStatus: number }

export async function replanTicketTask(ticketId: number, taskId: number,
  payload: ReplanTicketTaskRequest): Promise<TicketTaskMutationResponse> {
  const { data } = await apiClient.put<TicketTaskMutationResponse>(`/tickets/${ticketId}/tasks/${taskId}`, payload)
  return data
}

export async function completeTicketTask(ticketId: number, taskId: number): Promise<TicketTaskMutationResponse> {
  const { data } = await apiClient.post<TicketTaskMutationResponse>(`/tickets/${ticketId}/tasks/${taskId}/complete`)
  return data
}

export async function cancelTicketTask(ticketId: number, taskId: number): Promise<TicketTaskMutationResponse> {
  const { data } = await apiClient.delete<TicketTaskMutationResponse>(`/tickets/${ticketId}/tasks/${taskId}`)
  return data
}

export async function listGroups(): Promise<import('@/lib/api/types').Group[]> {
  const { data } = await apiClient.get('/groups')
  return data
}
export async function listChannels(): Promise<import('@/lib/api/types').Channel[]> {
  const { data } = await apiClient.get('/channels')
  return data
}
export async function listGroupQueue(groupId: number, limit = 20, offset = 0, signal?: AbortSignal): Promise<PagedResult<TicketSummary>> {
  const { data } = await apiClient.get<PagedResult<TicketSummary>>('/tickets/by-group', {
    params: { groupId, unassigned: true, limit, offset },
    signal,
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

export async function getAdminWatcherStatus(): Promise<import('@/lib/api/types').AdminWatcherStatus> {
  const { data } = await apiClient.get<import('@/lib/api/types').AdminWatcherStatus>('/admin/watcher-status')
  return data
}

export async function recoverAdminWatcherTicket(ticketId: number): Promise<{ recovered: boolean; ticketId: number }> {
  const { data } = await apiClient.post<{ recovered: boolean; ticketId: number }>(`/admin/watcher/recover/${ticketId}`)
  return data
}

