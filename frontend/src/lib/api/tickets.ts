import { apiClient } from '@/lib/apiClient'
import type {
  CreatedTicket,
  CreateTicketInput,
  PagedResult,
  TicketDetail,
  TicketListParams,
  TicketSummary,
} from '@/lib/api/types'

export async function listTickets(params: TicketListParams): Promise<PagedResult<TicketSummary>> {
  const { data } = await apiClient.get<PagedResult<TicketSummary>>('/tickets', { params })
  return data
}

export async function getTicket(id: number): Promise<TicketDetail> {
  const { data } = await apiClient.get<TicketDetail>(`/tickets/${id}`)
  return data
}

export async function createTicket(input: CreateTicketInput): Promise<CreatedTicket> {
  const { data } = await apiClient.post<CreatedTicket>('/tickets', input)
  return data
}

export async function updateTicketStatus(id: number, status: number): Promise<void> {
  await apiClient.patch(`/tickets/${id}/status`, { status })
}
