import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useClaimTicketMutation,
  useGroupQueueQuery,
  useGroupsQuery,
  useTicketsQuery,
  useUpdateTicketStatusMutation,
} from '@/hooks/useTickets'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

import { PageHeader } from '@/components/layout/PageHeader'
import { KanbanSegmentedTabs, type KanbanColumnTab } from './KanbanSegmentedTabs'
import { ResolveTicketDialog } from './ResolveTicketDialog'
import { TechnicianFilter } from './TechnicianFilter'
import { TicketCard } from './TicketCard'

type ColumnId = 'queue' | 'mine' | 'in_progress' | 'pending' | 'resolved'

interface ColumnDef {
  id: ColumnId
  title: string
  description: string
  bgClass: string
  badgeClass: string
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'queue',
    title: 'Cola del grupo',
    description: 'Sin asignar',
    bgClass: 'bg-slate-50/70 border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'mine',
    title: 'Mis tickets',
    description: 'Asignados a mí',
    bgClass: 'bg-blue-50/60 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'in_progress',
    title: 'En progreso',
    description: 'Trabajando',
    bgClass: 'bg-indigo-50/60 border-indigo-200',
    badgeClass: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'pending',
    title: 'Pendiente',
    description: 'Esperando',
    bgClass: 'bg-amber-50/60 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'resolved',
    title: 'Resuelto',
    description: 'Listo',
    bgClass: 'bg-emerald-50/60 border-emerald-200',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
]

const COLUMN_IDS: ColumnId[] = ['queue', 'mine', 'in_progress', 'pending', 'resolved']

const VALID_TRANSITIONS: Record<ColumnId, ColumnId[]> = {
  queue: ['mine'],
  mine: ['in_progress'],
  in_progress: ['pending', 'resolved'],
  pending: ['in_progress'],
  resolved: [],
}

const EMPTY_MESSAGES: Record<ColumnId, { title: string; subtitle: string; icon: string }> = {
  queue: {
    title: 'No hay tickets en cola 🎉',
    subtitle: 'Todos los tickets del grupo han sido asignados.',
    icon: '📭',
  },
  mine: {
    title: 'No tienes tickets asignados',
    subtitle: 'Revisa la cola para tomar nuevos tickets y empezar.',
    icon: '📋',
  },
  in_progress: {
    title: 'No estás trabajando en ningún ticket',
    subtitle: 'Elige un ticket de "Mis tickets" y pulsa "Empezar".',
    icon: '⚡',
  },
  pending: {
    title: 'No hay tickets en espera',
    subtitle: 'Ningún ticket se encuentra bloqueado por terceros o proveedores.',
    icon: '⏳',
  },
  resolved: {
    title: 'No hay tickets resueltos',
    subtitle: 'Los tickets que soluciones aparecerán listados aquí.',
    icon: '✅',
  },
}

function KanbanColumn({
  column,
  tickets,
  isLoading,
  emptyMessage = 'No hay tickets aquí',
  onClaim,
  isClaiming,
}: {
  column: ColumnDef
  tickets: TicketSummary[]
  isLoading?: boolean
  emptyMessage?: string
  onClaim?: (ticketId: number) => void
  isClaiming?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div data-column-id={column.id} className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div>
          <span className="text-sm font-semibold">{column.title}</span>
          <p className="text-[11px] text-muted-foreground">{column.description}</p>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', column.badgeClass)}>
          {tickets.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-36 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors flex-1',
          column.bgClass,
          isOver ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        )}
      >
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                draggable={column.id !== 'resolved'}
                actionButton={
                  column.id === 'queue' ? (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs w-full"
                      disabled={isClaiming}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation()
                        onClaim?.(ticket.id)
                      }}
                    >
                      Asignarme
                    </Button>
                  ) : column.id === 'in_progress' || column.id === 'pending' ? (
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Abrir detalle →
                    </Link>
                  ) : null
                }
              />
            ))}

            {tickets.length === 0 ? (
              <div className="flex h-28 items-center justify-center rounded border border-dashed border-border/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">{emptyMessage}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export function Kanban() {
  const selectedAssignee = useSelectedAssignee()
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = selectedAssignee ?? currentUser?.userId ?? null

  const groupsQuery = useGroupsQuery()
  const currentGroupId =
    groupsQuery.data && groupsQuery.data.length > 0 ? groupsQuery.data[0].id : null

  const queueQuery = useGroupQueueQuery(currentGroupId)
  const myTicketsQuery = useTicketsQuery(currentUserId)

  const updateStatus = useUpdateTicketStatusMutation()
  const claimMutation = useClaimTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  const [activeId, setActiveId] = useState<number | null>(null)
  const [resolveTicketId, setResolveTicketId] = useState<number | null>(null)

  // Pointer sensor with distance prevents click conflict on buttons and links
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const queueTickets = useMemo(() => queueQuery.data?.items ?? [], [queueQuery.data])

  const myTicketsByColumn = useMemo(() => {
    const all = myTicketsQuery.data?.items ?? []
    return {
      mine: all.filter((t) => t.status === 1 || t.status === 2),
      in_progress: all.filter((t) => t.status === 3),
      pending: all.filter((t) => t.status === 4),
      resolved: all.filter((t) => t.status === 5),
    }
  }, [myTicketsQuery.data])

  const ticketsByColumn: Record<ColumnId, TicketSummary[]> = useMemo(
    () => ({
      queue: queueTickets,
      mine: myTicketsByColumn.mine,
      in_progress: myTicketsByColumn.in_progress,
      pending: myTicketsByColumn.pending,
      resolved: myTicketsByColumn.resolved,
    }),
    [queueTickets, myTicketsByColumn],
  )

  // Smart default tab para móvil: in_progress si se está trabajando en alguno; si no, queue
  const defaultTab = useMemo<ColumnId>(() => {
    if (myTicketsByColumn.in_progress.length > 0) return 'in_progress'
    if (queueTickets.length > 0) return 'queue'
    if (myTicketsByColumn.mine.length > 0) return 'mine'
    if (myTicketsByColumn.pending.length > 0) return 'pending'
    return 'queue'
  }, [queueTickets.length, myTicketsByColumn])

  const [userSelectedTab, setUserSelectedTab] = useState<ColumnId | null>(null)
  const activeTab: ColumnId = userSelectedTab ?? defaultTab

  // Auto-refresh en cola cada 30 segundos si la tab activa es 'queue'
  useEffect(() => {
    if (activeTab !== 'queue') return
    const interval = setInterval(() => {
      void queueQuery.refetch()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeTab, queueQuery])

  // Badge pulsante: detectar nuevos tickets en la cola
  const [lastSeenQueueCount, setLastSeenQueueCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('glpi_last_seen_queue_count')
      return saved != null ? Number(saved) : 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    if (activeTab === 'queue' && queueTickets.length !== lastSeenQueueCount) {
      setLastSeenQueueCount(queueTickets.length)
      try {
        localStorage.setItem('glpi_last_seen_queue_count', String(queueTickets.length))
      } catch {
        // ignore
      }
    }
  }, [activeTab, queueTickets.length, lastSeenQueueCount])

  const hasNewQueueTickets = queueTickets.length > lastSeenQueueCount

  // Swipe entre tabs
  const handleSwipe = (direction: 'left' | 'right') => {
    const currentIndex = COLUMN_IDS.indexOf(activeTab)
    if (direction === 'left' && currentIndex < COLUMN_IDS.length - 1) {
      setUserSelectedTab(COLUMN_IDS[currentIndex + 1])
    } else if (direction === 'right' && currentIndex > 0) {
      setUserSelectedTab(COLUMN_IDS[currentIndex - 1])
    }
  }

  const allActiveTickets = useMemo(() => {
    const allMine = myTicketsQuery.data?.items ?? []
    return [...queueTickets, ...allMine]
  }, [queueTickets, myTicketsQuery.data])

  const activeTicket = allActiveTickets.find((ticket) => ticket.id === activeId) ?? null

  const handleClaim = (ticketId: number) => {
    claimMutation.mutate(ticketId, {
      onSuccess: () => {
        pushToast({
          title: `Ticket #${ticketId} asignado`,
          description: 'El ticket se agregó a tus tickets asignados.',
          variant: 'success',
        })
      },
      onError: (err) => {
        pushToast({
          title: 'No se pudo asignar el ticket',
          description: getApiErrorMessage(err),
          variant: 'destructive',
        })
      },
    })
  }

  const handleStart = (ticketId: number) => {
    updateStatus.mutate(
      { ticketId, status: 3 },
      {
        onSuccess: () =>
          pushToast({
            title: `Ticket #${ticketId} en progreso`,
            description: 'Se cambió el estado a Planificado / En progreso.',
            variant: 'success',
          }),
        onError: (err) =>
          pushToast({
            title: 'No se pudo cambiar el estado',
            description: getApiErrorMessage(err),
            variant: 'destructive',
          }),
      },
    )
  }

  const handleResume = (ticketId: number) => {
    updateStatus.mutate(
      { ticketId, status: 3 },
      {
        onSuccess: () =>
          pushToast({
            title: `Ticket #${ticketId} retomado`,
            description: 'Se reanudó el trabajo en progreso.',
            variant: 'success',
          }),
        onError: (err) =>
          pushToast({
            title: 'No se pudo cambiar el estado',
            description: getApiErrorMessage(err),
            variant: 'destructive',
          }),
      },
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(Number(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over) {
      return
    }

    const ticketId = Number(active.id)
    const targetId = String(over.id) as ColumnId

    // Find source column of the dragged ticket
    let sourceId: ColumnId | null = null
    for (const col of COLUMNS) {
      if (ticketsByColumn[col.id].some((t) => t.id === ticketId)) {
        sourceId = col.id
        break
      }
    }

    if (!sourceId || sourceId === targetId) {
      return
    }

    // Check if transition is allowed
    const allowedTargets = VALID_TRANSITIONS[sourceId] ?? []
    if (!allowedTargets.includes(targetId)) {
      return
    }

    // Execute valid transition
    if (sourceId === 'queue' && targetId === 'mine') {
      handleClaim(ticketId)
      return
    }

    if (sourceId === 'mine' && targetId === 'in_progress') {
      handleStart(ticketId)
      return
    }

    if (sourceId === 'in_progress' && targetId === 'pending') {
      updateStatus.mutate(
        { ticketId, status: 4 },
        {
          onSuccess: () =>
            pushToast({
              title: `Ticket #${ticketId} marcado como pendiente`,
              description: 'En espera de respuesta externa o proveedor.',
              variant: 'success',
            }),
          onError: (err) =>
            pushToast({
              title: 'No se pudo cambiar el estado',
              description: getApiErrorMessage(err),
              variant: 'destructive',
            }),
        },
      )
      return
    }

    if (sourceId === 'pending' && targetId === 'in_progress') {
      handleResume(ticketId)
      return
    }

    if (sourceId === 'in_progress' && targetId === 'resolved') {
      setResolveTicketId(ticketId)
      return
    }
  }

  const hasGeneralError = myTicketsQuery.isError || queueQuery.isError
  const generalErrorMessage = getApiErrorMessage(myTicketsQuery.error ?? queueQuery.error)

  const segmentedTabColumns: KanbanColumnTab[] = COLUMNS.map((col) => ({
    id: col.id,
    title: col.title,
    count: ticketsByColumn[col.id].length,
    hasNew: col.id === 'queue' && hasNewQueueTickets,
  }))

  const activeMobileTickets = ticketsByColumn[activeTab]
  const isMobileLoading =
    activeTab === 'queue'
      ? queueQuery.isLoading || groupsQuery.isLoading
      : myTicketsQuery.isLoading

  const getMobileActionButton = (colId: ColumnId, ticket: TicketSummary) => {
    switch (colId) {
      case 'queue':
        return (
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs"
            disabled={claimMutation.isPending}
            onClick={(e) => {
              e.stopPropagation()
              handleClaim(ticket.id)
            }}
          >
            Asignarme
          </Button>
        )
      case 'mine':
        return (
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs"
            disabled={updateStatus.isPending}
            onClick={(e) => {
              e.stopPropagation()
              handleStart(ticket.id)
            }}
          >
            Empezar
          </Button>
        )
      case 'in_progress':
        return (
          <Button
            size="sm"
            variant="default"
            className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={(e) => {
              e.stopPropagation()
              setResolveTicketId(ticket.id)
            }}
          >
            Resolver
          </Button>
        )
      case 'pending':
        return (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
            disabled={updateStatus.isPending}
            onClick={(e) => {
              e.stopPropagation()
              handleResume(ticket.id)
            }}
          >
            Retomar
          </Button>
        )
      case 'resolved':
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kanban"
        description="Arrastra un ticket entre columnas para cambiar su estado según el flujo operativo."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Kanban' }]}
        actions={
          <div className="hidden md:block">
            <TechnicianFilter />
          </div>
        }
      />

      {hasGeneralError ? (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <span>{generalErrorMessage}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void queueQuery.refetch()
              void myTicketsQuery.refetch()
            }}
          >
            Reintentar
          </Button>
        </div>
      ) : null}

      {/* =========================================================================
          VISTA MÓVIL (< md): Segmented Tabs + Lista Vertical + Gestos Swipe
         ========================================================================= */}
      <div className="md:hidden space-y-3">
        {/* Segmented Tabs Bar */}
        <KanbanSegmentedTabs
          columns={segmentedTabColumns}
          activeId={activeTab}
          onSelect={(id) => setUserSelectedTab(id as ColumnId)}
        />

        {/* Encabezado contextual de la columna activa + botón refrescar */}
        <div className="flex items-center justify-between px-1 pt-0.5">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {COLUMNS.find((c) => c.id === activeTab)?.title}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {activeMobileTickets.length} {activeMobileTickets.length === 1 ? 'ticket' : 'tickets'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => {
              void queueQuery.refetch()
              void myTicketsQuery.refetch()
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(queueQuery.isFetching || myTicketsQuery.isFetching ? 'animate-spin' : '')}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span className="ml-1">Recargar</span>
          </Button>
        </div>

        {/* Lista Vertical con soporte Swipe Horizontal */}
        <motion.div
          key={activeTab}
          data-testid="kanban-mobile-list"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_e, info) => {
            if (info.offset.x < -60 || info.velocity.x < -300) {
              handleSwipe('left')
            } else if (info.offset.x > 60 || info.velocity.x > 300) {
              handleSwipe('right')
            }
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-2.5 touch-pan-y"
        >
          {isMobileLoading ? (
            <div className="space-y-3 p-1">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : activeMobileTickets.length > 0 ? (
            activeMobileTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                draggable={false}
                compact={true}
                actionButton={getMobileActionButton(activeTab, ticket)}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8 text-center bg-card/40 my-2"
            >
              <span className="text-3xl mb-2">{EMPTY_MESSAGES[activeTab].icon}</span>
              <p className="text-sm font-semibold text-foreground">
                {EMPTY_MESSAGES[activeTab].title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                {EMPTY_MESSAGES[activeTab].subtitle}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* =========================================================================
          VISTA DESKTOP (md:+): 5 Columnas en paralelo + Drag & Drop @dnd-kit
         ========================================================================= */}
      <div className="hidden md:block">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((column) => {
              const isLoading =
                column.id === 'queue'
                  ? queueQuery.isLoading || groupsQuery.isLoading
                  : myTicketsQuery.isLoading

              const emptyMessage =
                column.id === 'queue' && currentGroupId == null
                  ? 'Sin grupo asignado'
                  : 'No hay tickets aquí'

              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tickets={ticketsByColumn[column.id]}
                  isLoading={isLoading}
                  emptyMessage={emptyMessage}
                  onClaim={handleClaim}
                  isClaiming={claimMutation.isPending}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeTicket ? (
              <div className="w-72">
                <TicketCard ticket={activeTicket} draggable={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <ResolveTicketDialog
        ticketId={resolveTicketId ?? 0}
        open={resolveTicketId !== null}
        onOpenChange={(v) => {
          if (!v) setResolveTicketId(null)
        }}
      />
    </div>
  )
}
