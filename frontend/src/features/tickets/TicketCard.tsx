import { useDraggable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'motion/react'
import { Calendar, Clock, MessageSquare, Timer, User } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { TicketSummary } from '@/lib/api/types'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useTechniciansQuery } from '@/hooks/useTickets'

import { priorityMeta, statusMeta } from './labels'

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

function formatEstimatedDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

function TicketCardComponent({
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
  const { data: technicians } = useTechniciansQuery()

  const techMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const t of technicians ?? []) {
      map.set(t.id, t.displayName || t.username)
    }
    return map
  }, [technicians])

  const getTechLabel = useCallback((id?: number | null) => {
    if (!id) return null
    if (currentUser?.userId === id) return `${currentUser.displayName || currentUser.username} (yo)`
    return techMap.get(id) ?? `Técnico #${id}`
  }, [currentUser, techMap])

  const assignee = useMemo(() => {
    const ids = ticket.assigneeIds ?? []
    if (ids.length === 0) {
      return { initials: '—', label: 'Sin asignar', assigned: false }
    }
    const firstId = ids[0]
    const label = getTechLabel(firstId) ?? `Técnico #${firstId}`
    const initials =
      firstId === currentUser?.userId && currentUser?.username
        ? currentUser.username.slice(0, 2).toUpperCase()
        : techMap.get(firstId)?.slice(0, 2).toUpperCase() || `T${firstId}`
    return { initials, label, assigned: true }
  }, [ticket.assigneeIds, currentUser, techMap, getTechLabel])
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !draggable,
  })

  const priority = priorityMeta(ticket.priority)
  const status = statusMeta(ticket.status)

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
          '@container relative flex flex-col justify-between gap-2.5 rounded-xl border border-border/60 bg-card p-3.5 shadow-sm hover:border-primary/40 transition-[border-color,box-shadow,transform] duration-150 ease-out min-h-[88px]',
          onCardClick && 'cursor-pointer active:scale-[0.98]',
          isDragging && 'opacity-60',
        )}
      >
        {/* Línea 1: #ID · Status/Priority Dot · Badge prioridad · Avatar Técnico */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'size-2 rounded-full shrink-0',
                ticket.priority >= 4 ? 'bg-rose-500' : ticket.priority === 3 ? 'bg-amber-500' : 'bg-emerald-500'
              )}
              title={priority.label}
              aria-hidden="true"
            />
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              #{ticket.id}
            </span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[110px]">
              {ticket.typeLabel}
            </span>
          </div>

          <div
            title={assignee.label}
            aria-label={assignee.label}
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border-0 shadow-xs',
              assignee.assigned
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground',
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

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cn('px-2 py-0.5 text-[11px] font-semibold', status.badgeClass)}>
            Estado GLPI: {status.label}
          </Badge>
        </div>

        {ticket.status === 3 && (
          <div className="flex flex-col gap-1.5 text-[11px] text-blue-700 dark:text-blue-300 bg-blue-500/10 p-2.5 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between">
              <span className="font-bold inline-flex items-center gap-1 text-[11px] text-blue-800 dark:text-blue-200">
                <Calendar className="size-3 text-blue-600 dark:text-blue-400" />
                En proceso (planificado)
              </span>
              <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded font-bold text-blue-900 dark:text-blue-300">GLPI 3</span>
            </div>
            {ticket.nextPlannedAt && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                <Clock className="size-3 text-blue-600 dark:text-blue-400" />
                <span>{formatDateTime(ticket.nextPlannedAt)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-1">
              <span className="inline-flex items-center gap-0.5">
                <User className="size-2.5" />
                {ticket.nextPlannedTechnicianId
                  ? (getTechLabel(ticket.nextPlannedTechnicianId) ?? `Técnico #${ticket.nextPlannedTechnicianId}`)
                  : assignee.assigned
                    ? assignee.label
                    : 'Técnico asignado'}
              </span>
              {ticket.nextPlannedDuration && formatEstimatedDuration(ticket.nextPlannedDuration) && (
                <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                  <Timer className="size-2.5" /> {formatEstimatedDuration(ticket.nextPlannedDuration)}
                </span>
              )}
            </div>
            {ticket.nextPlannedComment && (
              <p className="text-[10px] text-foreground/90 line-clamp-2 italic inline-flex items-start gap-1 pt-0.5 border-t border-blue-500/15">
                <MessageSquare className="size-2.5 shrink-0 mt-0.5 text-blue-500/70" />
                <span>{ticket.nextPlannedComment}</span>
              </p>
            )}
          </div>
        )}

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
        'group relative @container kanban-card-item rounded-xl border border-border/50 bg-card p-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-105 shadow-2xl ring-2 ring-primary border-dashed',
        isOverlay && 'shadow-2xl ring-2 ring-primary bg-card scale-105',
        !shouldReduceMotion && shake && 'toast-error-shake',
      )}
      {...attributes}
      {...listeners}
      role="article"
    >
      {/* Top row: Priority Dot + Assignee Avatar */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={cn(
              'size-2 rounded-full shrink-0',
              ticket.priority >= 4 ? 'bg-rose-500' : ticket.priority === 3 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            title={priority.label}
            aria-hidden="true"
          />
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
            'flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border-0 transition-colors shadow-xs',
            assignee.assigned
              ? 'bg-primary/15 text-primary'
              : 'bg-muted/70 text-muted-foreground',
          )}
        >
          {assignee.assigned ? assignee.initials : <User className="size-3" />}
        </div>
      </div>

      {/* Title with single #id element */}
      <Link
        to={`/tickets/${ticket.id}`}
        className="line-clamp-2 text-[14px] font-semibold leading-relaxed text-foreground hover:text-primary hover:underline transition-colors duration-150"
      >
        <span className="font-mono text-xs font-semibold text-muted-foreground mr-1">
          #{ticket.id}
        </span>
        {ticket.title}
      </Link>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge className={cn('px-2 py-0.5 text-[11px] font-semibold', status.badgeClass)}>
          Estado GLPI: {status.label}
        </Badge>
      </div>

      {ticket.status === 3 && (
        <div className="mt-2.5 flex flex-col gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 p-2.5 text-[11px] text-blue-700 dark:text-blue-300">
          <div className="flex items-center justify-between">
            <span className="font-bold inline-flex items-center gap-1.5 text-xs text-blue-800 dark:text-blue-200">
              <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
              En proceso (planificado)
            </span>
            <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded font-bold text-blue-900 dark:text-blue-300">GLPI 3</span>
          </div>

          {ticket.nextPlannedAt && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <Clock className="size-3 text-blue-600 dark:text-blue-400" />
              <span>{formatDateTime(ticket.nextPlannedAt)}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                ({formatRelative(ticket.nextPlannedAt)})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <User className="size-3" />
              {ticket.nextPlannedTechnicianId
                ? (getTechLabel(ticket.nextPlannedTechnicianId) ?? `Técnico #${ticket.nextPlannedTechnicianId}`)
                : assignee.assigned
                  ? assignee.label
                  : 'Técnico asignado'}
            </span>
            {ticket.nextPlannedDuration && formatEstimatedDuration(ticket.nextPlannedDuration) && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Timer className="size-3" />
                {formatEstimatedDuration(ticket.nextPlannedDuration)}
              </span>
            )}
          </div>

          {ticket.nextPlannedComment && (
            <div className="mt-1 pt-1 border-t border-blue-500/15 flex items-start gap-1 text-[11px] text-foreground/90 italic">
              <MessageSquare className="size-3 shrink-0 mt-0.5 text-blue-500/70" />
              <span className="line-clamp-2">{ticket.nextPlannedComment}</span>
            </div>
          )}
        </div>
      )}

      {/* Meta: Relative time */}
      <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 shrink-0">
          <Clock className="size-3" aria-hidden="true" />
          Actualizado {formatRelative(ticket.updatedAt)}
        </span>
      </div>

      {actionButton ? (
        /* Soft expansion: the card grows downward on hover and reveals the
           action buttons without ever overlaying the title or meta text. */
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-all duration-300 ease-out motion-reduce:transition-none">
          <div
            className="overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-2 pt-3">{actionButton}</div>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}

export const TicketCard = memo(TicketCardComponent)
