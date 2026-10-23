/**
 * Types mirroring the .NET API contracts (System.Text.Json camelCase).
 * Source of truth: src/GlpiTicketManager.Application/Dtos
 */

export type AppRole = 'technician' | 'supervisor' | 'admin'

export interface UserProfile {
  userId: number
  username: string
  displayName: string
  profileId: number | null
  defaultEntityId: number | null
  role?: AppRole
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

export interface TicketSolution {
  id: number
  userId: number
  content: string
  createdAt: string
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
  solutions?: TicketSolution[]
}

export interface TicketListParams {
  assigneeId?: number
  serviceId?: number
  limit?: number
  offset?: number
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

export interface Service {
  id: number
  name: string
  parentId: number | null
  completeName: string
  level: number
}

export interface GroupDashboardSummary {
  total: number
  queued: number
  assigned: number
  inProgress: number
  pending: number
  resolved: number
  closed: number
}

export interface TeamMember {
  id?: number
  userId: number
  name: string
  activeTickets: number
  pendingTickets: number
  pendingCount?: number
  queuedCount?: number
  resolvedToday?: number
  currentTicketId: number | null
  currentTicket?: number | null
  activeTicket?: number | null
  lastComment?: string | null
}

export interface GroupDashboard {
  totalTickets: number
  queuedTickets: number
  assignedTickets: number
  inProgressTickets: number
  pendingTickets: number
  resolvedTickets: number
  closedTickets: number
  summary?: GroupDashboardSummary | null
  technicians: TeamMember[]
}

export interface CreateTicketRequest {
  title: string
  description: string
  urgency?: number
  categoryId?: number | null
}

export interface CreateTicketResponse {
  ticketId: number
}

export interface GroupSummary {
  groupId: number
  groupName: string
  totalTickets: number
  pendingTickets: number
  activeTechnicians: number
}
