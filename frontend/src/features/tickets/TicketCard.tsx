import { useDraggable } from '@dnd-kit/core'
import { motion, useReducedMotion } from 'motion/react'
import { Calendar, Clock, MessageSquare, Timer, User } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/avatar'
import { PriorityBadge, StatusBadge } from '@/components/ui/status-badge'
import { useTechniciansQuery } from '@/hooks/useTickets'
import type { TicketSummary } from '@/lib/api/types'
import { formatDateTime, formatRelative } from '@/lib/format'
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

  const getTechLabel = useCallback(
    (id?: number | null) => {
      if (!id) return null
      if (currentUser?.userId === id) return `${currentUser.displayName || currentUser.username} (yo)`
      const known = techMap.get(id)
      if (known) return known
      if (ticket.groupName) return `Especialista (${ticket.groupName})`
      return 'Especialista de Soporte'
    },
    [currentUser, techMap, ticket.groupName],
  )

  const assignee = useMemo(() => {
    const ids = ticket.assigneeIds ?? []
    if (ids.length === 0) {
      return { initials: '', label: 'Sin asignar', assigned: false }
    }
    const firstId = ids[0]
    const label =
      getTechLabel(firstId) ?? (ticket.groupName ? `Equipo ${ticket.groupName}` : 'Especialista asignado')
    const initials =
      firstId === currentUser?.userId && currentUser?.username
        ? currentUser.username.slice(0, 2).toUpperCase()
        : techMap.get(firstId)?.slice(0, 2).toUpperCase() || 'ST'
    return { initials, label, assigned: true }
  }, [ticket.assigneeIds, ticket.groupName, currentUser, techMap, getTechLabel])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    disabled: !draggable,
  })

  const dndAttributes = useMemo(() => {
    if (!draggable) {
      return {}
    }
    const { 'aria-disabled': _dndDisabled, ...rest } = attributes
    return rest
  }, [draggable, attributes])

  const priority = priorityMeta(ticket.priority)

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
        animate={highlight ? { boxShadow: '0 0 0 2px rgb(29 78 216)' } : {}}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
        className={cn(
          '@container relative flex flex-col justify-between gap-2.5 rounded-xl border border-border border-l-[3px] bg-card p-3.5 shadow-xs hover:border-primary/40 transition-[border-color,box-shadow,transform] duration-150 ease-out min-h-[88px]',
          priority.stripeClass,
          onCardClick && 'cursor-pointer active:scale-[0.99]',
          isDragging && 'opacity-60',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-xs font-semibold text-muted-foreground">#{ticket.id}</span>
            <PriorityBadge priority={ticket.priority} size="sm" />
            <span className="text-[11px] text-muted-foreground truncate max-w-[90px]">
              {ticket.typeLabel}
            </span>
          </div>

          <Avatar
            initials={assignee.assigned ? assignee.initials : ''}
            size="xs"
            tone={assignee.assigned ? 'primary' : 'muted'}
            title={assignee.label}
          />
        </div>

        <Link
          to={`/tickets/${ticket.id}`}
          className="line-clamp-2 text-sm font-semibold text-foreground leading-snug hover:text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {ticket.title}
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={ticket.status} size="sm" />
        </div>

        {ticket.status === 3 && (
          <div className="flex flex-col gap-1.5 text-[11px] text-blue-800 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold inline-flex items-center gap-1 text-[11px]">
                <Calendar className="size-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                En proceso (planificado)
              </span>
              <span className="text-[10px] font-mono bg-blue-500/15 px-1.5 py-0.5 rounded font-semibold">
                GLPI 3
              </span>
            </div>
            {ticket.nextPlannedAt && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                <Clock className="size-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>{formatDateTime(ticket.nextPlannedAt)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-muted-foreground flex-wrap gap-1">
              <span className="inline-flex items-center gap-0.5">
                <User className="size-2.5" aria-hidden="true" />
                {ticket.nextPlannedTechnicianId
                  ? (getTechLabel(ticket.nextPlannedTechnicianId) ??
                    (ticket.groupName ? `Especialista (${ticket.groupName})` : 'Especialista asignado'))
                  : assignee.assigned
                    ? assignee.label
                    : 'Técnico asignado'}
              </span>
              {ticket.nextPlannedDuration && formatEstimatedDuration(ticket.nextPlannedDuration) && (
                <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                  <Timer className="size-2.5" aria-hidden="true" />{' '}
                  {formatEstimatedDuration(ticket.nextPlannedDuration)}
                </span>
              )}
            </div>
            {ticket.nextPlannedComment && (
              <p className="text-[10px] text-foreground/90 line-clamp-2 italic inline-flex items-start gap-1 pt-0.5 border-t border-blue-500/15">
                <MessageSquare className="size-2.5 shrink-0 mt-0.5 text-blue-500/70" aria-hidden="true" />
                <span>{ticket.nextPlannedComment}</span>
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
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
              {ticket.status >= 5 ? 'Ver detalle (solo lectura) →' : 'Ver detalle →'}
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
        boxShadow: highlight ? '0 0 0 2px rgb(29 78 216)' : '0 0 0 0px transparent',
      }}
      transition={
        shouldReduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }
      }
      className={cn(
        'group relative @container kanban-card-item kanban-card-hover rounded-xl border border-border border-l-[3px] bg-card p-3.5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        priority.stripeClass,
        draggable && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 scale-[1.02] shadow-xl ring-2 ring-primary border-dashed',
        isOverlay && 'shadow-xl ring-2 ring-primary bg-card scale-[1.02]',
        !shouldReduceMotion && shake && 'toast-error-shake',
      )}
      {...dndAttributes}
      {...(draggable ? listeners : {})}
      role="article"
    >
      {/* Top row: Priority Lozenge + Type + Assignee Avatar */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <PriorityBadge priority={ticket.priority} size="sm" />
          <span className="text-[11px] text-muted-foreground truncate font-medium">
            {ticket.typeLabel}
          </span>
        </div>

        <Avatar
          initials={assignee.assigned ? assignee.initials : ''}
          size="xs"
          tone={assignee.assigned ? 'primary' : 'muted'}
          title={assignee.label}
          data-testid={`ticket-avatar-${ticket.id}`}
        />
      </div>

      {/* Title with single #id element */}
      <Link
        to={`/tickets/${ticket.id}`}
        className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground hover:text-primary hover:underline transition-colors duration-150"
      >
        <span className="font-mono text-xs font-semibold text-muted-foreground mr-1">
          #{ticket.id}
        </span>
        {ticket.title}
      </Link>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusBadge status={ticket.status} size="sm" />
      </div>

      {ticket.status === 3 && (
        <div className="mt-2.5 flex flex-col gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 text-[11px] text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold inline-flex items-center gap-1.5 text-xs">
              <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              En proceso (planificado)
            </span>
            <span className="text-[10px] font-mono bg-blue-500/15 px-1.5 py-0.5 rounded font-semibold">
              GLPI 3
            </span>
          </div>

          {ticket.nextPlannedAt && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <Clock className="size-3 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>{formatDateTime(ticket.nextPlannedAt)}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                ({formatRelative(ticket.nextPlannedAt)})
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-1.5 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <User className="size-3" aria-hidden="true" />
              {ticket.nextPlannedTechnicianId
                ? (getTechLabel(ticket.nextPlannedTechnicianId) ??
                  (ticket.groupName ? `Especialista (${ticket.groupName})` : 'Especialista asignado'))
                : assignee.assigned
                  ? assignee.label
                  : 'Técnico asignado'}
            </span>
            {ticket.nextPlannedDuration && formatEstimatedDuration(ticket.nextPlannedDuration) && (
              <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                <Timer className="size-3" aria-hidden="true" />
                {formatEstimatedDuration(ticket.nextPlannedDuration)}
              </span>
            )}
          </div>

          {ticket.nextPlannedComment && (
            <div className="mt-1 pt-1 border-t border-blue-500/15 flex items-start gap-1 text-[11px] text-foreground/90 italic">
              <MessageSquare className="size-3 shrink-0 mt-0.5 text-blue-500/70" aria-hidden="true" />
              <span className="line-clamp-2">{ticket.nextPlannedComment}</span>
            </div>
          )}
        </div>
      )}

      {/* Meta: Relative time + Read-only detail link for resolved/closed */}
      <div className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">Actualizado {formatRelative(ticket.updatedAt)}</span>
        </span>
        {ticket.status >= 5 && (
          <Link
            to={`/tickets/${ticket.id}`}
            className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 w-fit"
            onClick={(e) => e.stopPropagation()}
            data-testid={`readonly-detail-link-${ticket.id}`}
          >
            Ver detalle (solo lectura) →
          </Link>
        )}
      </div>

      {actionButton ? (
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-all duration-200 ease-out motion-reduce:transition-none">
          <div
            className="overflow-hidden"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 mt-2.5">
              {actionButton}
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  )
}

export const TicketCard = memo(TicketCardComponent)
