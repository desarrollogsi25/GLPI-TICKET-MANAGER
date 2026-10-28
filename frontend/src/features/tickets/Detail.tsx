import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTicketQuery, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { formatDateTime, formatRelative, toPlainText } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { priorityMeta, statusMeta, TICKET_STATUSES, TICKET_TYPES } from './labels'
import { PendingTicketDialog } from './PendingTicketDialog'
import { ReopenTicketDialog } from './ReopenTicketDialog'
import { ResolveTicketDialog } from './ResolveTicketDialog'

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const { data: ticket, isLoading, isError, error } = useTicketQuery(ticketId)
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)
  const currentUser = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role ?? state.user?.role)
  const currentTime = useCurrentTime()
  const [resolveOpen, setResolveOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)

  const changeStatus = (status: number) => {
    updateStatus.mutate(
      { ticketId, status },
      {
        onSuccess: () =>
          pushToast({ title: 'Estado actualizado', variant: 'success' }),
        onError: (mutationError) =>
          pushToast({
            title: getApiErrorTitle(mutationError, 'No se pudo cambiar el estado'),
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
  // Reopen policy (backend-enforced): only an admin can reopen a Closed (6) ticket.
  // An assigned technician may still reopen a Solved (5) ticket.
  const canReopen =
    role === 'admin'
      ? ticket.status === 5 || ticket.status === 6
      : ticket.status === 5 &&
        currentUser?.userId != null &&
        ticket.assigneeIds.some((id) => Number(id) === Number(currentUser.userId))

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <div className="space-y-1.5">
            <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold tracking-tight text-foreground leading-tight">
              <span className="text-muted-foreground">#{ticket.id}</span> {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge className={status.badgeClass}>{status.label}</Badge>
              <Badge className={priority.badgeClass}>{priority.label}</Badge>
              <Badge variant="outline">{type}</Badge>
            </div>
          </div>
        }
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Tickets', href: '/tickets' },
          { label: `#${ticket.id}` },
        ]}
      />

      {/* Layout de 2 columnas en Desktop (2/3 izquierda, 1/3 derecha) y 1 columna en móvil (H-61) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Columna Izquierda (2/3): Descripción, Solución y Seguimiento */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Descripción del problema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {toPlainText(ticket.content) || 'Sin descripción.'}
              </p>
            </CardContent>
          </Card>

          {ticket.solutions && ticket.solutions.length > 0 && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md rounded-2xl shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 shadow-xs">Solución</Badge>
                  <CardTitle className="text-base font-semibold">Solución aplicada</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.solutions.map((sol) => (
                  <div key={sol.id} className="border-l-2 border-emerald-500/60 pl-4 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Usuario #{sol.userId}</span>
                      <span>· {formatDateTime(sol.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {toPlainText(sol.content) || '—'}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Historial y Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.followups.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin seguimientos registrados.</p>
              ) : (
                <ol className="space-y-4">
                  {ticket.followups.map((followup) => (
                    <li key={followup.id} className="border-l-2 border-border/80 pl-4 py-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Usuario #{followup.userId}</span>
                        <span>{formatDateTime(followup.createdAt)}</span>
                        {followup.isPrivate ? <Badge variant="secondary" className="text-[10px]">Privado</Badge> : null}
                      </div>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                        {toPlainText(followup.content) || '—'}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha (1/3): Cambiar estado y Detalles */}
        <div className="space-y-4">
          {/* Card: Cambiar estado con validación visual idéntica a Kanban */}
          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {ticket.status === 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                    disabled={updateStatus.isPending}
                    data-testid="start-ticket-btn"
                    onClick={() => changeStatus(3)}
                  >
                    Iniciar ticket
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  className="rounded-xl"
                  disabled={
                    ticket.status === 2 ||
                    ticket.status === 4 ||
                    ticket.status === 5 ||
                    ticket.status === 6 ||
                    updateStatus.isPending
                  }
                  title={
                    ticket.status === 2
                      ? 'Primero debes iniciar el ticket (En Progreso) para resolverlo.'
                      : ticket.status === 4
                        ? 'Debes reanudar a En Progreso primero.'
                        : undefined
                  }
                  onClick={() => setResolveOpen(true)}
                >
                  Resolver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  disabled={ticket.status === 4 || ticket.status === 5 || ticket.status === 6 || updateStatus.isPending}
                  onClick={() => setPendingOpen(true)}
                  data-testid="pending-ticket-btn"
                >
                  Poner en pendiente
                </Button>
                {canReopen && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl"
                    data-testid="reopen-ticket-btn"
                    onClick={() => setReopenOpen(true)}
                  >
                    Reabrir
                  </Button>
                )}
              </div>

              <div className="pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                {TICKET_STATUSES.map((option) => {
                  const isBackwardBlocked =
                    role !== 'admin' &&
                    ((ticket.status === 5 && option.value < 5) ||
                      (ticket.status === 6 && option.value <= 5))

                  const isPendingInvalidTransition =
                    ticket.status === 4 && option.value !== 3

                  const isAssigneeDirectResolveBlocked =
                    ticket.status === 2 && option.value === 5

                  const isRewindToNewBlocked =
                    role !== 'admin' && ticket.status > 1 && option.value === 1

                  const isCloseAdminOnly =
                    role !== 'admin' && option.value === 6

                  const isDisabled =
                    option.value === ticket.status ||
                    updateStatus.isPending ||
                    isBackwardBlocked ||
                    isPendingInvalidTransition ||
                    isAssigneeDirectResolveBlocked ||
                    isRewindToNewBlocked ||
                    isCloseAdminOnly

                  return (
                    <Button
                      key={option.value}
                      variant={option.value === ticket.status ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl text-xs"
                      disabled={isDisabled}
                      title={
                        isAssigneeDirectResolveBlocked
                          ? 'Primero debes iniciar el ticket (En Progreso) para resolverlo.'
                          : isPendingInvalidTransition
                            ? 'Debes reanudar a En Progreso primero.'
                            : isBackwardBlocked
                              ? 'No se puede retroceder el estado de este ticket.'
                              : undefined
                      }
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
                  )
                })}
              </div>

              {ticket.status === 2 && (
                <p className="text-xs text-muted-foreground font-medium">
                  Primero debes iniciar el ticket (En Progreso) para poder resolverlo.
                </p>
              )}
              {ticket.status === 4 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Debes reanudar a En Progreso primero.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Card: Metadatos y Detalles con tiempo real relativo */}
          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Detalles del Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm divide-y divide-border/30">
              <div className="flex justify-between gap-4 pt-1">
                <span className="text-muted-foreground text-xs">Creado</span>
                <span className="font-medium text-xs text-foreground">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <span className="text-muted-foreground text-xs">Actualizado</span>
                <span className="font-medium text-xs text-foreground">{formatRelative(ticket.updatedAt, currentTime)}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <span className="text-muted-foreground text-xs">Resuelto</span>
                <span className="font-medium text-xs text-foreground">{ticket.solvedAt ? formatDateTime(ticket.solvedAt) : '—'}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <span className="text-muted-foreground text-xs">Técnicos asignados</span>
                <span className="font-medium text-xs text-foreground">{ticket.assigneeIds.map((userId) => `#${userId}`).join(', ') || '—'}</span>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <span className="text-muted-foreground text-xs">Solicitantes</span>
                <span className="font-medium text-xs text-foreground">{ticket.requesterIds.map((userId) => `#${userId}`).join(', ') || '—'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ResolveTicketDialog ticketId={ticketId} open={resolveOpen} onOpenChange={setResolveOpen} />
      <ReopenTicketDialog ticketId={ticketId} open={reopenOpen} onOpenChange={setReopenOpen} />
      <PendingTicketDialog ticketId={ticketId} open={pendingOpen} onOpenChange={setPendingOpen} />
    </div>
  )
}
