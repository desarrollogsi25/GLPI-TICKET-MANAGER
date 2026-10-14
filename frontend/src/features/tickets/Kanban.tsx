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
import { useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { useTicketsQuery, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { useToastStore } from '@/store/toastStore'

import { TICKET_STATUSES } from './labels'
import { ResolveTicketDialog } from './ResolveTicketDialog'
import { TechnicianFilter } from './TechnicianFilter'
import { TicketCard } from './TicketCard'

function KanbanColumn({
  statusValue,
  label,
  tickets,
}: {
  statusValue: number
  label: string
  tickets: TicketSummary[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusValue })

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{tickets.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={
          isOver
            ? 'flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-primary bg-accent/40 p-2'
            : 'flex min-h-24 flex-col gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-2'
        }
      >
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}

        {tickets.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Sin tickets</p>
        ) : null}
      </div>
    </div>
  )
}

export function Kanban() {
  const assigneeId = useSelectedAssignee()
  const { data, isLoading, isError, error } = useTicketsQuery(assigneeId)
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [resolveTicketId, setResolveTicketId] = useState<number | null>(null)

  // A small activation distance keeps clicks (opening the ticket) working.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const tickets = data?.items ?? []
  const activeTicket = tickets.find((ticket) => ticket.id === activeId) ?? null

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
    const newStatus = Number(over.id)
    const ticket = tickets.find((item) => item.id === ticketId)

    if (!ticket || ticket.status === newStatus) {
      return
    }

    if (newStatus === 5) {
      setResolveTicketId(ticketId)
      return
    }

    updateStatus.mutate(
      { ticketId, status: newStatus },
      {
        onSuccess: () =>
          pushToast({
            title: `Ticket #${ticketId} actualizado`,
            description: 'El estado se cambió en GLPI.',
            variant: 'success',
          }),
        onError: (mutationError) =>
          pushToast({
            title: 'No se pudo cambiar el estado',
            description: getApiErrorMessage(mutationError),
            variant: 'destructive',
          }),
      },
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            Arrastra un ticket entre columnas para cambiar su estado.
          </p>
        </div>
        <TechnicianFilter />
      </div>

      {assigneeId == null ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Selecciona un técnico para ver su tablero.
        </p>
      ) : isError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {getApiErrorMessage(error)}
        </p>
      ) : isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {TICKET_STATUSES.map((status) => (
            <div key={status.value} className="w-72 shrink-0 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {TICKET_STATUSES.map((status) => (
              <KanbanColumn
                key={status.value}
                statusValue={status.value}
                label={status.label}
                tickets={tickets.filter((ticket) => ticket.status === status.value)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTicket ? (
              <div className="w-72">
                <TicketCard ticket={activeTicket} draggable={false} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

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
