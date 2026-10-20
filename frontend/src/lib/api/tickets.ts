import { apiClient } from '@/lib/apiClient'
import type {
  PagedResult,
  TicketSummary,
} from '@/lib/api/types'

export interface TicketListParams {
  assigneeId?: number
  serviceId?: number
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

export async function reopenTicket(id: number, reason?: string): Promise<import('@/lib/api/types').TicketDetail> {
  const { data } = await apiClient.post(`/tickets/${id}/reopen`, reason ? { reason } : {})
  return data
}