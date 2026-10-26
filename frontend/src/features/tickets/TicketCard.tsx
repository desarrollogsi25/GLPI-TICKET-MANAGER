import { useDraggable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'motion/react'
import { Clock, User } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

import { priorityMeta } from './labels'

interface TicketCardProps {
  ticket: TicketSummary
  draggable?: boolean
  actionButton?: React.ReactNode
  compact?: boolean
  highlight?: boolean
  shake?: boolean
  isOverlay?: boolean
  onCardClick?: () => void
}

function getAssigneeInitials(ticket: TicketSummary, currentUsername?: string): {
  initials: string
  label: string
  assigned: boolean
} {
  const assigneeIds = ticket.assigneeIds ?? []
  if (assigneeIds.length === 0) {
    return { initials: '—', label: 'Sin asignar', assigned: false }
  }
  const firstId = assigneeIds[0]
  if (currentUsername) {
    return {
      initials: currentUsername.slice(0, 2).toUpperCase(),
      label: `Técnico #${firstId}`,
      assigned: true,
    }
  }
  return {
    initials: `T${firstId}`,
    label: `Técnico #${firstId}`,
    assigned: true,
  }
}

export function TicketCard({
  ticket,
  draggable = true,
  actionButton,
  compact = false,
  highlight = false,
  shake = false,
  isOverlay = false,
  onCardClick,
}: TicketCardProps) {
  const shouldReduceMotion = useReducedMotion()
  const currentUser = useAuthStore((s) => s.user)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !draggable,
  })

  const priority = priorityMeta(ticket.priority)
  const assignee = getAssigneeInitials(ticket, currentUser?.displayName || currentUser?.username)

  if (compact) {
    return (
      <motion.div
        role={onCardClick ? 'button' : undefined}
        tabIndex={onCardClick ? 0 : undefined}
        aria-label={onCardClick ? `Ticket #${ticket.id}: ${ticket.title}` : undefined}
        onKeyDown={
          onCardClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onCardClick()
                }
              }
            : undefined
        }
        onClick={onCardClick}
        animate={highlight ? { boxShadow: '0 0 0 2px rgb(109 89 232)' } : {}}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        className={cn(
          '@container relative flex flex-col justify-between gap-2.5 rounded-2xl border border-[#44403C]/40 dark:border-[#44403C]/50 bg-card dark:bg-[#2E2824] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] hover:border-primary/50 transition-[border-color,box-shadow,transform] duration-150 ease-out min-h-[88px]',
          onCardClick && 'cursor-pointer active:scale-[0.98]',
          isDragging && 'opacity-60',
        )}
      >
        {/* Línea 1: #ID · Badge prioridad · Avatar Técnico */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              #{ticket.id}
            </span>
            <Badge className={cn('text-[10px] px-1.5 py-0 font-medium', priority.badgeClass)}>
              {priority.label}
            </Badge>
            <span className="text-[11px] text-muted-foreground truncate max-w-[110px]">
              {ticket.typeLabel}
            </span>
          </div>

          <div
            title={assignee.label}
            aria-label={assignee.label}
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border',
              assignee.assigned
                ? 'bg-primary/15 text-primary border-primary/25'
                : 'bg-muted text-muted-foreground border-border',
            )}
          >
            {assignee.assigned ? assignee.initials : <User className="size-3" />}
          </div>
        </div>

        {/* Línea 2: Título con truncate a 2 líneas */}
        <Link
          to={`/tickets/${ticket.id}`}
          className="line-clamp-2 text-sm font-semibold text-foreground leading-snug hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {ticket.title}
        </Link>

        {/* Línea 3: Timestamp relativo + Acción inline (touch target >= 44px en móvil) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3 shrink-0" aria-hidden="true" />
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
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 min-h-[36px] px-1"
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
      style={
        transform && !isDragging
          ? {
              transform: `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`,
            }
          : undefined
      }
      animate={{
        boxShadow: highlight ? '0 0 0 2px rgb(109 89 232)' : '0 0 0 0px transparent',
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
      }
      className={cn(
        '@container kanban-card-item kanban-card-hover rounded-2xl border border-[#44403C]/40 dark:border-[#44403C]/50 bg-card dark:bg-[#2E2824] p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.24)] hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 transition-[box-shadow,border-color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30 ring-1 ring-primary/40 border-dashed',
        isOverlay && 'scale-[1.02] shadow-2xl ring-2 ring-primary border-primary bg-card dark:bg-[#332C26]',
        !shouldReduceMotion && shake && 'toast-error-shake',
      )}
      {...attributes}
      {...listeners}
      role="article"
    >
      {/* Top row: Priority Badge + Assignee Avatar */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge className={cn('text-[10px] px-1.5 py-0 font-medium', priority.badgeClass)}>
            {priority.label}
          </Badge>
          <span className="text-[11px] text-muted-foreground truncate font-medium">
            {ticket.typeLabel}
          </span>
        </div>

        <div
          role="img"
          title={assignee.label}
          aria-label={assignee.label}
          data-testid={`ticket-avatar-${ticket.id}`}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border transition-colors',
            assignee.assigned
              ? 'bg-primary/15 text-primary border-primary/25'
              : 'bg-muted/70 text-muted-foreground border-border/60',
          )}
        >
          {assignee.assigned ? assignee.initials : <User className="size-3" />}
        </div>
      </div>

      {/* Title with single #id element */}
      <Link
        to={`/tickets/${ticket.id}`}
        className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-primary hover:underline transition-colors duration-150"
      >
        <span className="font-mono text-xs font-semibold text-muted-foreground mr-1">
          #{ticket.id}
        </span>
        {ticket.title}
      </Link>

      {/* Meta: Relative time */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 shrink-0">
          <Clock className="size-3" aria-hidden="true" />
          Actualizado {formatRelative(ticket.updatedAt)}
        </span>
      </div>

      {actionButton ? (
        <div
          className="mt-3 pt-2.5 border-t border-border/50"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {actionButton}
        </div>
      ) : null}
    </motion.div>
  )
}
