import { useDraggable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'motion/react'
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
  compact?: boolean
  highlight?: boolean
  shake?: boolean
}

export function TicketCard({
  ticket,
  draggable = true,
  actionButton,
  compact = false,
  highlight = false,
  shake = false,
}: TicketCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !draggable,
  })

  const priority = priorityMeta(ticket.priority)

  if (compact) {
    return (
      <motion.div
        animate={highlight ? { boxShadow: '0 0 0 2px rgb(109 89 232)' } : {}}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
        className={cn(
          'relative flex flex-col justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-xs hover:border-primary/40 transition-all min-h-[80px]',
          isDragging && 'opacity-60',
        )}
      >
        {/* Línea 1: #ID · Badge prioridad · Tipo */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-muted-foreground">#{ticket.id}</span>
            <Badge className={cn('text-[10px] px-1.5 py-0 font-medium', priority.badgeClass)}>
              {priority.label}
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">{ticket.typeLabel}</span>
        </div>

        {/* Línea 2: Título con truncate a 2 líneas */}
        <Link
          to={`/tickets/${ticket.id}`}
          className="line-clamp-2 text-sm font-semibold text-foreground leading-snug hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {ticket.title}
        </Link>

        {/* Línea 3: Timestamp relativo + Acción inline */}
        <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground">
            {formatRelative(ticket.updatedAt)}
          </span>
          {actionButton ? (
            <div
              className="shrink-0"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {actionButton}
            </div>
          ) : (
            <Link
              to={`/tickets/${ticket.id}`}
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Ver detalle →
            </Link>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      animate={{
        boxShadow: highlight ? '0 0 0 2px rgb(109 89 232)' : '0 0 0 0px transparent',
        x: !shouldReduceMotion && shake ? [0, -4, 4, -4, 4, 0] : 0,
      }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
      className={cn(
        'rounded-lg border border-border bg-card p-3 shadow-xs hover:shadow-md hover:border-primary/40 transition-shadow duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-60 shadow-lg',
      )}
      {...attributes}
      {...listeners}
      role="article"
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
    </motion.div>
  )
}
