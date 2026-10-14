import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTicketQuery, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { formatDateTime, formatRelative, toPlainText } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'
import { useUiStore } from '@/store/uiStore'
import type { TicketTask } from '@/store/uiStore'

const EMPTY_TASKS: TicketTask[] = []

import { priorityMeta, statusMeta, TICKET_STATUSES, TICKET_TYPES } from './labels'
import { ResolveTicketDialog } from './ResolveTicketDialog'

function TicketTasksPanel({ ticketId }: { ticketId: number }) {
  const taskMap = useUiStore((state) => state.tasks)
const tasks = taskMap[ticketId] ?? (EMPTY_TASKS as TicketTask[])
  const addTask = useUiStore((state) => state.addTask)
  const toggleTask = useUiStore((state) => state.toggleTask)
  const removeTask = useUiStore((state) => state.removeTask)
  const [draft, setDraft] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const label = draft.trim()
    if (!label) {
      return
    }
    addTask(ticketId, label)
    setDraft('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas</CardTitle>
        <p className="text-xs text-muted-foreground">
          Lista de comprobación guardada en el navegador (estado local de la UI).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <Input
            value={draft}
            placeholder="Añadir una tarea"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" variant="secondary">
            Añadir
          </Button>
        </form>

        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas para este ticket.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(ticketId, task.id)}
                  className="size-4"
                />
                <span className={cn('flex-1 text-sm', task.done && 'text-muted-foreground line-through')}>
                  {task.label}
                </span>
                <button
                  type="button"
                  onClick={() => removeTask(ticketId, task.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                  aria-label="Eliminar tarea"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const { data: ticket, isLoading, isError, error } = useTicketQuery(ticketId)
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)
  const [resolveOpen, setResolveOpen] = useState(false)

  const changeStatus = (status: number) => {
    updateStatus.mutate(
      { ticketId, status },
      {
        onSuccess: () =>
          pushToast({ title: 'Estado actualizado', variant: 'success' }),
        onError: (mutationError) =>
          pushToast({
            title: 'No se pudo cambiar el estado',
            description: getApiErrorMessage(mutationError),
            variant: 'destructive',
          }),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          {getApiErrorMessage(error)}
        </p>
        <Link to="/tickets" className="text-sm underline">
          Volver al listado
        </Link>
      </div>
    )
  }

  const status = statusMeta(ticket.status)
  const priority = priorityMeta(ticket.priority)
  const type = TICKET_TYPES.find((item) => item.value === ticket.type)?.label ?? ticket.typeLabel

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Link to="/tickets" className="text-xs text-muted-foreground hover:underline">
            ← Volver al listado
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            <span className="text-muted-foreground">#{ticket.id}</span> {ticket.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={status.badgeClass}>{status.label}</Badge>
            <Badge className={priority.badgeClass}>{priority.label}</Badge>
            <Badge variant="outline">{type}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {toPlainText(ticket.content) || 'Sin descripción.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="default"
                disabled={ticket.status === 5 || updateStatus.isPending}
                onClick={() => setResolveOpen(true)}
              >
                Resolver
              </Button>
              {TICKET_STATUSES.map((option) => (
                <Button
                  key={option.value}
                  variant={option.value === ticket.status ? 'default' : 'outline'}
                  size="sm"
                  disabled={option.value === ticket.status || updateStatus.isPending}
                  onClick={() => {
                    if (option.value === 5) {
                      setResolveOpen(true)
                    } else {
                      changeStatus(option.value)
                    }
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.followups.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin seguimientos.</p>
              ) : (
                <ol className="space-y-4">
                  {ticket.followups.map((followup) => (
                    <li key={followup.id} className="border-l-2 border-border pl-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Usuario #{followup.userId}</span>
                        <span>{formatDateTime(followup.createdAt)}</span>
                        {followup.isPrivate ? <Badge variant="secondary">Privado</Badge> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {toPlainText(followup.content) || '—'}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Creado</span>
                <span>{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Actualizado</span>
                <span>{formatRelative(ticket.updatedAt)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Resuelto</span>
                <span>{ticket.solvedAt ? formatDateTime(ticket.solvedAt) : '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Técnicos</span>
                <span>{ticket.assigneeIds.map((userId) => `#${userId}`).join(', ') || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Solicitantes</span>
                <span>{ticket.requesterIds.map((userId) => `#${userId}`).join(', ') || '—'}</span>
              </div>
            </CardContent>
          </Card>

          <TicketTasksPanel ticketId={ticket.id} />
        </div>
      </div>
      <ResolveTicketDialog ticketId={ticketId} open={resolveOpen} onOpenChange={setResolveOpen} />
    </div>
  )
}
