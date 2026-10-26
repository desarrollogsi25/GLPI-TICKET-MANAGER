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
            <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold font-serif tracking-tight text-foreground leading-tight">
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
                disabled={
                  ticket.status === 4 ||
                  ticket.status === 5 ||
                  ticket.status === 6 ||
                  updateStatus.isPending
                }
                title={
                  ticket.status === 4
                    ? 'No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.'
                    : undefined
                }
                onClick={() => setResolveOpen(true)}
              >
                Resolver
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ticket.status === 5 || ticket.status === 6 || updateStatus.isPending}
                onClick={() => setPendingOpen(true)}
                data-testid="pending-ticket-btn"
              >
                Poner en pendiente
              </Button>
              {canReopen && (
                <Button
                  size="sm"
                  variant="secondary"
                  data-testid="reopen-ticket-btn"
                  onClick={() => setReopenOpen(true)}
                >
                  Reabrir
                </Button>
              )}
              {TICKET_STATUSES.map((option) => {
                const isBackwardBlocked =
                  role !== 'admin' &&
                  ((ticket.status === 5 && option.value < 5) ||
                    (ticket.status === 6 && option.value <= 5))

                return (
                  <Button
                    key={option.value}
                    variant={option.value === ticket.status ? 'default' : 'outline'}
                    size="sm"
                    disabled={
                      option.value === ticket.status ||
                      updateStatus.isPending ||
                      isBackwardBlocked ||
                      // H-39: from Pendiente only Retomar (En Progreso) is valid.
                      // Resolver (5) and Cerrar (6) must be rejected up front.
                      (ticket.status === 4 && option.value >= 5)
                    }
                    title={
                      ticket.status === 4 && option.value >= 5
                        ? 'No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.'
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
              {ticket.status === 4 && (
                <p className="w-full text-xs text-muted-foreground">
                  No se puede resolver un ticket desde Pendiente. Primero debe reanudarse a En Progreso.
                </p>
              )}
            </CardContent>
          </Card>

          {ticket.solutions && ticket.solutions.length > 0 && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">Solución</Badge>
                  <CardTitle className="text-base">Solución aplicada</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.solutions.map((sol) => (
                  <div key={sol.id} className="border-l-2 border-emerald-500/60 pl-4 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Usuario #{sol.userId}</span>
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
        </div>
      </div>
      <ResolveTicketDialog ticketId={ticketId} open={resolveOpen} onOpenChange={setResolveOpen} />
      <ReopenTicketDialog ticketId={ticketId} open={reopenOpen} onOpenChange={setReopenOpen} />
      <PendingTicketDialog ticketId={ticketId} open={pendingOpen} onOpenChange={setPendingOpen} />
    </div>
  )
}
