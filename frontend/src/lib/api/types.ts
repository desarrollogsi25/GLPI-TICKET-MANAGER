/**
 * Types mirroring the .NET API contracts (System.Text.Json camelCase).
 * Source of truth: src/GlpiTicketManager.Application/Dtos
 */

export interface UserProfile {
  userId: number
  username: string
  displayName: string
  profileId: number | null
  defaultEntityId: number | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  user: UserProfile
}

export interface LoginRequest {
  username: string
  password: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface TicketSummary {
  id: number
  title: string
  status: number
  statusLabel: string
  type: number
  typeLabel: string
  priority: number
  priorityLabel: string
  urgency: number
  impact: number
  categoryId: number | null
  createdAt: string
  updatedAt: string
  solvedAt: string | null
  hasSolution: boolean
  assigneeIds: number[]
  requesterIds: number[]
}

export interface TicketFollowup {
  id: number
  userId: number
  content: string | null
  createdAt: string
  isPrivate: boolean
}

export interface TicketDetail {
  id: number
  title: string
  content: string | null
  status: number
  statusLabel: string
  type: number
  typeLabel: string
  priority: number
  priorityLabel: string
  urgency: number
  impact: number
  categoryId: number | null
  createdAt: string
  updatedAt: string
  solvedAt: string | null
  closedAt: string | null
  assigneeIds: number[]
  requesterIds: number[]
  followups: TicketFollowup[]
}

export interface TicketListParams {
  assigneeId: number
  limit?: number
  offset?: number
}

export interface CreateTicketInput {
  title: string
  content?: string
  type: number
  urgency: number
  impact: number
  categoryId?: number
  requesterId?: number
  assigneeId?: number
}

export interface CreatedTicket {
  id: number
}

export interface StatusCount {
  status: number
  statusLabel: string
  count: number
}

export interface TechnicianWorkload {
  userId: number
  openTickets: number
}

export interface DashboardStats {
  totalTickets: number
  openTickets: number
  newTickets: number
  assignedTickets: number
  pendingTickets: number
  solvedTickets: number
  closedTickets: number
  overdueTickets: number
  averageResolutionHours: number | null
  byStatus: StatusCount[]
  byTechnician: TechnicianWorkload[]
}

export interface Group { id: number; name: string }
export interface Channel { id: number; name: string }
export interface SolutionResponse { id: number }
