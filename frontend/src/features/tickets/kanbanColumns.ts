import type { TicketSummary } from '../../lib/api/types'

export function ticketColumn(ticket: TicketSummary) {
  if (ticket.status >= 5) return 'resolved'
  if (ticket.status === 3) return 'in_progress'
  if (ticket.status === 4) return 'pending'
  // Operational queue: states 1/2 without an executor. The status badge remains GLPI's.
  if (!ticket.assigneeIds?.length || ticket.status === 1) return 'queue'
  return 'mine'
}
