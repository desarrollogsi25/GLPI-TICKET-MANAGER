import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

import { priorityMeta, statusMeta } from './labels'

interface TicketListCardProps {
  ticket: TicketSummary
}

export function TicketListCard({ ticket }: TicketListCardProps) {
  const priority = priorityMeta(ticket.priority)
  const status = statusMeta(ticket.status)

  return (
    <Link
      to={`/tickets/${ticket.id}`}
      className="block text-inherit no-underline"
      data-testid="ticket-card"
    >
      <article className="rounded-xl border border-border bg-card p-4 min-h-[88px] active:scale-[0.98] transition-all duration-150 ease-out shadow-xs hover:border-primary/40">
        {/* Línea 1: ID + Badge prioridad + Tipo */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground font-semibold">
              #{ticket.id}
            </span>
            <Badge className={cn('text-[10px] px-1.5 py-0 font-medium', priority.badgeClass)}>
              {priority.label}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">
            {ticket.typeLabel}
          </span>
        </div>

        {/* Línea 2: Título (2 líneas max) */}
        <h3 className="text-sm font-semibold line-clamp-2 mb-2 text-foreground leading-snug">
          {ticket.title}
        </h3>

        {/* Línea 3: Estado + Fecha + Chevron */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge className={cn('text-[10px] px-1.5 py-0 font-medium', status.badgeClass)}>
              {status.label}
            </Badge>
            <span>{formatRelative(ticket.updatedAt)}</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-muted-foreground shrink-0"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </div>
      </article>
    </Link>
  )
}
