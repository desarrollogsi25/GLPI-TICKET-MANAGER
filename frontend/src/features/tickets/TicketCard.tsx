import { useDraggable } from '@dnd-kit/core'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

import { priorityMeta } from './labels'

interface TicketCardProps {
  ticket: TicketSummary
  draggable?: boolean
  actionButton?: React.ReactNode
}

export function TicketCard({ ticket, draggable = true, actionButton }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !draggable,
  })

  const priority = priorityMeta(ticket.priority)

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={cn(
        'rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-60',
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        to={`/tickets/${ticket.id}`}
        className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
      >
        <span className="text-muted-foreground">#{ticket.id}</span> {ticket.title}
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge className={priority.badgeClass}>{priority.label}</Badge>
        <span className="text-xs text-muted-foreground">{ticket.typeLabel}</span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Actualizado {formatRelative(ticket.updatedAt)}
      </p>

      {actionButton ? (
        <div
          className="mt-3 pt-2 border-t border-border/50"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {actionButton}
        </div>
      ) : null}
    </div>
  )
}
