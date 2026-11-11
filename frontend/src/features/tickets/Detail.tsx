import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, CheckCircle, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RichContent } from '@/components/ui/rich-content'
import { useTicketQuery, useTicketTasksQuery, useUpdateTicketStatusMutation,
  useCompleteTicketTaskMutation, useCancelTicketTaskMutation } from '@/hooks/useTickets'
import type { TicketTask } from '@/lib/api/tickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { formatDateTime, formatRelative } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuthStore } from '@/store/authStore'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { priorityMeta, statusMeta, TICKET_STATUSES, TICKET_TYPES } from './labels'
import { PendingTicketDialog } from './PendingTicketDialog'
import { PlanTicketDialog } from './PlanTicketDialog'
import { ReplanTicketTaskDialog } from './ReplanTicketTaskDialog'
import { ReopenTicketDialog } from './ReopenTicketDialog'
import { ResolveTicketDialog } from './ResolveTicketDialog'

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const navigate = useNavigate()
  const { data: ticket, isLoading, isError, error } = useTicketQuery(ticketId)
  const { data: tasks, isLoading: tasksLoading, isError: tasksFailed, error: tasksError } = useTicketTasksQuery(ticketId)

  const currentUser = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.user?.role ?? state.role)
  const isRequester = role === 'solicitante'

  const getTechName = (techId?: number | null) => {
    if (!techId) return '—'
    if (currentUser?.userId === techId) return `${currentUser.displayName || currentUser.username} (yo)`
    const known = ticket?.participantNames?.[techId]
    if (known) return known
    return isRequester ? 'Especialista de Soporte Técnico Asignado' : `Técnico #${techId}`
  }

  const hasActionableTask = Boolean(tasks?.some((t) => t.state === 1 || t.state === 2))
  const updateStatus = useUpdateTicketStatusMutation()
  const completeTask = useCompleteTicketTaskMutation()
  const cancelTask = useCancelTicketTaskMutation()
  const pushToast = useToastStore((state) => state.push)
  const currentTime = useCurrentTime()
  const [resolveOpen, setResolveOpen] = useState(false)
  const [reopenOpen, setReopenOpen] = useState(false)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [replanTask, setReplanTask] = useState<TicketTask | null>(null)
  const [taskAction, setTaskAction] = useState<{ taskId: number; action: 'complete' | 'cancel' } | null>(null)

  const confirmTaskAction = async () => {
    if (!taskAction) return
    const { taskId, action } = taskAction
    try {
      await (action === 'complete' ? completeTask : cancelTask).mutateAsync({ ticketId, taskId })
      pushToast({ title: action === 'complete' ? `Tarea #${taskId} completada` : `Tarea #${taskId} cancelada`,
        variant: 'success' })
      setTaskAction(null)
    } catch (mutationError) {
      pushToast({ title: getApiErrorTitle(mutationError, 'No se pudo actualizar la tarea'),
        description: getApiErrorMessage(mutationError), variant: 'destructive' })
    }
  }

  const changeStatus = (status: number) => {
    if (ticket?.status === 6) {
      pushToast({
        title: 'Operación no permitida',
        description: 'No se puede modificar directamente el estado de un ticket cerrado. Requiere reapertura administrativa formal.',
        variant: 'destructive',
      })
      return
    }
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
    const isForbidden =
      (error && typeof error === 'object' && ('status' in error || 'statusCode' in error) &&
        ((error as any).status === 403 || (error as any).statusCode === 403)) ||
      getApiErrorMessage(error).toLowerCase().includes('permiso') ||
      getApiErrorMessage(error).toLowerCase().includes('denegado')

    const homePath = role === 'solicitante' ? '/tickets' : '/kanban'

    return (
      <div className="mx-auto max-w-lg py-12 px-4 text-center">
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">
              {isForbidden ? `Acceso restringido al ticket #${ticketId}` : 'Ticket no disponible'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isForbidden
                ? 'No tienes permisos para consultar este ticket porque pertenece a otro grupo o técnico.'
                : getApiErrorMessage(error) || 'No fue posible cargar los detalles del ticket.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
            <Button
              type="button"
              onClick={() => navigate(homePath)}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              Ir a la vista principal
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tickets')}
            >
              Ver mis tickets
            </Button>
          </div>
        </div>
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
              {ticket.content ? (
                <RichContent content={ticket.content} />
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin descripción.</p>
              )}
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
                      <span className="font-semibold text-foreground">
                        {getTechName(sol.userId)}
                      </span>
                      <span>· {formatDateTime(sol.createdAt)}</span>
                    </div>
                    <RichContent content={sol.content} className="mt-1" />
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
                        <span className="font-semibold text-foreground">
                          {getTechName(followup.userId)}
                        </span>
                        <span>{formatDateTime(followup.createdAt)}</span>
                        {followup.isPrivate ? <Badge variant="secondary" className="text-[10px]">Privado</Badge> : null}
                      </div>
                      <RichContent content={followup.content} className="mt-1.5" />
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Tareas de GLPI</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : tasksFailed ? (
                <p role="alert" className="text-sm text-destructive">
                  No se pudo consultar el calendario de tareas: {getApiErrorMessage(tasksError)}
                </p>
              ) : !tasks?.length ? (
                <p className="text-sm text-muted-foreground">No hay tareas registradas en GLPI.</p>
              ) : (
                <ol className="space-y-4" data-testid="ticket-tasks-timeline">
                  {[...tasks].sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? '') || a.id - b.id).map((task) => (
                    <li key={task.id} className="border-l-2 border-primary/50 pl-4 py-0.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Tarea #{task.id}</span>
                        <Badge variant={task.state === 2 ? 'secondary' : 'outline'}>
                          {task.state === 2 ? 'Realizada' : task.state === 1 ? 'Por hacer' : 'Información'}
                        </Badge>
                        {task.isPrivate ? <Badge variant="secondary">Privada</Badge> : null}
                        <span>{getTechName(task.technicianId)}</span>
                      </div>
                      <RichContent content={task.content} className="mt-1.5" />
                      {task.startAt && task.endAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(task.startAt)} – {formatDateTime(task.endAt)}
                        </p>
                      )}
                      {task.state === 1 && ticket.status >= 5 && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          Ticket finalizado; la tarea es de sólo lectura.
                        </p>
                      )}
                      {task.state === 1 && ticket.status === 1 && (
                        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                          Asigna el ticket antes de interactuar con sus tareas.
                        </p>
                      )}
                      {task.state === 1 && ticket.status >= 2 && ticket.status <= 4 &&
                        role === 'technician' && currentUser?.userId !== task.technicianId && (
                          <p className="mt-2 text-xs text-muted-foreground italic">
                            Tarea asignada a {getTechName(task.technicianId)}. Solo el técnico responsable o un supervisor/administrador pueden completarla.
                          </p>
                        )}
                      {task.state === 1 && ticket.status >= 2 && ticket.status <= 4 &&
                        (role === 'admin' || role === 'supervisor' ||
                          (currentUser?.userId === task.technicianId &&
                            ticket.assigneeIds.includes(task.technicianId))) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => setReplanTask(task)}>
                              Reprogramar
                            </Button>
                            <Button size="sm" variant="outline"
                              onClick={() => setTaskAction({ taskId: task.id, action: 'complete' })}>
                              Completar
                            </Button>
                            <Button size="sm" variant="destructive"
                              onClick={() => setTaskAction({ taskId: task.id, action: 'cancel' })}>
                              Cancelar tarea
                            </Button>
                          </div>
                        )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha (1/3): Cambiar estado y Detalles */}
        <div className="space-y-4">
          {/* Solicitantes consultan el estado nativo; no pueden mutar el ciclo de vida. */}
          {role === 'solicitante' ? (
            <Card className="rounded-2xl border-primary/20 bg-primary/5 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Estado del ticket en GLPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className={status.badgeClass}>{status.label}</Badge>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  El equipo de soporte actualiza este estado. Aquí podés consultar el avance y la solución.
                </p>
              </CardContent>
            </Card>
          ) : (
          <Card className="border-border/60 shadow-xs backdrop-blur-md bg-card/90 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Cambiar estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.status === 6 && (
                <div className="space-y-1.5 rounded-xl border border-muted-foreground/20 bg-muted/50 p-3 text-sm text-muted-foreground" data-testid="closed-readonly-banner">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Lock className="size-4 text-muted-foreground" />
                    <span>Ticket Cerrado (Modo lectura)</span>
                  </div>
                  <p className="text-xs">
                    {role === 'admin'
                      ? 'Este ticket está cerrado de forma definitiva. Las modificaciones directas están bloqueadas; como administrador conservas la facultad de reabrirlo formalmente registrando el motivo de auditoría.'
                      : 'Este ticket está cerrado de forma definitiva. No se admiten modificaciones ni reapertura por técnicos.'}
                  </p>
                </div>
              )}
              {ticket.status === 5 && (
                <div className="space-y-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-sm text-emerald-950 dark:text-emerald-200" data-testid="resolved-banner">
                  <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="size-4 text-emerald-600" />
                    <span>Ticket Resuelto</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La solución ha sido registrada en GLPI. El cierre automático definitivo lo gestiona la acción programada closeticket de GLPI.
                  </p>
                </div>
              )}
              {ticket.status === 4 && (
                <div className="space-y-2 rounded-xl border border-amber-300/50 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/20 dark:text-amber-100">
                  <p>
                    Este ticket está en espera. Reanúdalo a <strong>Asignado</strong> antes de editar
                    una tarea existente. Para volver a <strong>En proceso (planificado)</strong>,
                    GLPI debe confirmar una planificación nativa.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10 rounded-xl border-amber-500/50 bg-background/80"
                    disabled={updateStatus.isPending}
                    onClick={() => changeStatus(2)}
                    data-testid="resume-waiting-ticket-btn"
                  >
                    Reanudar a Asignado
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {ticket.status === 2 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-primary/40 text-primary hover:bg-primary/10"
                    disabled={ticket.assigneeIds.length === 0 || updateStatus.isPending}
                    data-testid="start-ticket-btn"
                    title={ticket.assigneeIds.length === 0 ? 'Asigna un técnico antes de planificar.' : undefined}
                    onClick={() => setPlanOpen(true)}
                  >
                    Planificar tarea
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  className="rounded-xl"
                  disabled={
                    ticket.assigneeIds.length === 0 || (ticket.status !== 2 && ticket.status !== 3) ||
                    updateStatus.isPending
                  }
                  title={
                    ticket.status === 4
                      ? 'No se puede resolver desde Pendiente. Primero debe reanudarse o replanificarse una tarea.'
                      : ticket.status === 1
                        ? 'Primero debes asignarte el ticket para poder resolverlo.'
                        : ticket.status === 5
                          ? 'El ticket ya fue resuelto.'
                          : ticket.status === 6
                            ? 'El ticket está cerrado.'
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
                  disabled={ticket.assigneeIds.length === 0 || ticket.status === 4 || ticket.status === 5 || ticket.status === 6 || updateStatus.isPending}
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
                  const isClosedDirectTransitionBlocked = ticket.status === 6

                  const isBackwardBlocked =
                    role !== 'admin' &&
                    ((ticket.status === 5 && option.value < 5) ||
                      (ticket.status === 6 && option.value <= 5))

                  const isPendingInvalidTransition =
                    ticket.status === 4 && option.value !== 2

                  const isAssigneeDirectResolveBlocked =
                    option.value === 5 && (ticket.status !== 2 && ticket.status !== 3)

                  const isRewindToNewBlocked =
                    role !== 'admin' && ticket.status > 1 && option.value === 1

                  const isCloseAdminOnly =
                    role !== 'admin' && option.value === 6

                  const isCloseUnsolvedBlocked =
                    option.value === 6 && ticket.status !== 5

                  const isDisabled =
                    isClosedDirectTransitionBlocked ||
                    option.value === ticket.status ||
                    updateStatus.isPending ||
                    isBackwardBlocked ||
                    isPendingInvalidTransition ||
                    isAssigneeDirectResolveBlocked ||
                    isRewindToNewBlocked ||
                    isCloseAdminOnly ||
                    isCloseUnsolvedBlocked

                  return (
                    <Button
                      key={option.value}
                      variant={option.value === ticket.status ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-xl text-xs"
                      disabled={isDisabled}
                      data-testid={`status-btn-${option.value}`}
                      title={
                        isClosedDirectTransitionBlocked
                          ? 'Los tickets cerrados no admiten cambios directos de estado; un administrador debe reabrirlo formalmente.'
                          : isCloseUnsolvedBlocked
                          ? 'El ticket debe ser resuelto antes de poder cerrarse.'
                          : isAssigneeDirectResolveBlocked
                            ? 'Primero debes asignarte el ticket para resolverlo.'
                            : isPendingInvalidTransition
                              ? 'Primero reanuda el ticket a Asignado; GLPI confirma la planificación mediante tareas nativas.'
                              : isBackwardBlocked
                                ? 'No se puede retroceder el estado de este ticket.'
                                : undefined
                      }
                      onClick={() => {
                        if (option.value === 3) {
                          setPlanOpen(true)
                        } else if (option.value === 5) {
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

              {ticket.status === 2 && !hasActionableTask && (
                <p className="text-xs text-muted-foreground font-medium">
                  Primero debes planificar y realizar al menos una tarea en GLPI para poder resolverlo.
                </p>
              )}
              {ticket.status === 4 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Reanuda el ticket a Asignado o replanifica su tarea antes de resolverlo.
                </p>
              )}
            </CardContent>
          </Card>
          )}

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
                <span className="font-medium text-xs text-foreground">
                  {ticket.assigneeIds.length > 0 ? (
                    ticket.assigneeIds.map((userId) => getTechName(userId)).join(', ')
                  ) : (
                    <span className="italic text-muted-foreground">En cola del grupo (sin técnico asignado)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between gap-4 pt-2">
                <span className="text-muted-foreground text-xs">Solicitantes</span>
                <span className="font-medium text-xs text-foreground">
                  {ticket.requesterIds
                    .map((userId) =>
                      userId === currentUser?.userId
                        ? `${currentUser.displayName || currentUser.username} (yo)`
                        : (ticket.participantNames?.[userId] ?? `Usuario no disponible (#${userId})`)
                    )
                    .join(', ') || '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ResolveTicketDialog ticketId={ticketId} open={resolveOpen} onOpenChange={setResolveOpen} />
      <ReopenTicketDialog ticketId={ticketId} open={reopenOpen} onOpenChange={setReopenOpen} />
      <PendingTicketDialog ticketId={ticketId} open={pendingOpen} onOpenChange={setPendingOpen} />
      <PlanTicketDialog ticketId={ticketId} open={planOpen} onOpenChange={setPlanOpen} />
      <ReplanTicketTaskDialog ticketId={ticketId} task={replanTask} onClose={() => setReplanTask(null)} />
      <Dialog open={taskAction !== null}
        onClose={() => { if (!completeTask.isPending && !cancelTask.isPending) setTaskAction(null) }}
        title={taskAction?.action === 'complete' ? 'Completar tarea' : 'Cancelar tarea'}
        description={taskAction?.action === 'complete'
          ? 'GLPI marcará la tarea como realizada. Se volverá a consultar el estado del ticket.'
          : 'GLPI eliminará esta tarea. Según la versión y configuración, puede ser definitivo. Confirma solo si estás seguro.'}>
        <div className="flex justify-end gap-2">
          <Button variant="outline" disabled={completeTask.isPending || cancelTask.isPending}
            onClick={() => setTaskAction(null)}>Volver</Button>
          <Button variant={taskAction?.action === 'cancel' ? 'destructive' : 'default'}
            disabled={completeTask.isPending || cancelTask.isPending} onClick={confirmTaskAction}>
            {completeTask.isPending || cancelTask.isPending ? 'Guardando...' : 'Confirmar en GLPI'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
