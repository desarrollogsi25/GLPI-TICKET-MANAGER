import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  ShieldAlert,
  UserPlus,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { RichContent } from '@/components/ui/rich-content'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityBadge, StatusBadge } from '@/components/ui/status-badge'
import { TicketStatusStepper } from '@/components/ui/status-stepper'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import {
  useCancelTicketTaskMutation,
  useClaimTicketMutation,
  useCompleteTicketTaskMutation,
  useTicketQuery,
  useTicketTasksQuery,
  useUpdateTicketStatusMutation,
} from '@/hooks/useTickets'
import { getApiErrorMessage, getApiErrorTitle } from '@/lib/api/errors'
import type { TicketTask } from '@/lib/api/tickets'
import { formatDateTime, formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

import { impactLabel, TICKET_STATUSES, TICKET_TYPES, urgencyLabel } from './labels'
import { PendingTicketDialog } from './PendingTicketDialog'
import { PlanTicketDialog } from './PlanTicketDialog'
import { ReopenTicketDialog } from './ReopenTicketDialog'
import { ReplanTicketTaskDialog } from './ReplanTicketTaskDialog'
import { ResolveTicketDialog } from './ResolveTicketDialog'

export function Detail() {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const navigate = useNavigate()
  const { data: ticket, isLoading, isError, error } = useTicketQuery(ticketId)
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksFailed,
    error: tasksError,
  } = useTicketTasksQuery(ticketId)

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
  const claimTicket = useClaimTicketMutation()
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

  const handleClaim = () => {
    claimTicket.mutate(ticketId, {
      onSuccess: () => {
        pushToast({
          title: 'Ticket asignado correctamente',
          description: `Te has asignado el ticket #${ticketId}`,
          variant: 'success',
        })
      },
      onError: (mutationError) => {
        pushToast({
          title: getApiErrorTitle(mutationError, 'No se pudo asignar el ticket'),
          description: getApiErrorMessage(mutationError),
          variant: 'destructive',
        })
      },
    })
  }

  const confirmTaskAction = async () => {
    if (!taskAction) return
    const { taskId, action } = taskAction
    try {
      await (action === 'complete' ? completeTask : cancelTask).mutateAsync({ ticketId, taskId })
      pushToast({
        title: action === 'complete' ? `Tarea #${taskId} completada` : `Tarea #${taskId} cancelada`,
        variant: 'success',
      })
      setTaskAction(null)
    } catch (mutationError) {
      pushToast({
        title: getApiErrorTitle(mutationError, 'No se pudo actualizar la tarea'),
        description: getApiErrorMessage(mutationError),
        variant: 'destructive',
      })
    }
  }

  const changeStatus = (status: number) => {
    if (ticket?.status === 6) {
      pushToast({
        title: 'Operación no permitida',
        description:
          'No se puede modificar directamente el estado de un ticket cerrado. Requiere reapertura administrativa formal.',
        variant: 'destructive',
      })
      return
    }
    updateStatus.mutate(
      { ticketId, status },
      {
        onSuccess: () => pushToast({ title: 'Estado actualizado', variant: 'success' }),
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
      <div className="space-y-4 pb-6">
        <Skeleton className="h-14 w-2/3 rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !ticket) {
    const isForbidden =
      (error &&
        typeof error === 'object' &&
        ('status' in error || 'statusCode' in error) &&
        ((error as { status?: number; statusCode?: number }).status === 403 ||
          (error as { status?: number; statusCode?: number }).statusCode === 403)) ||
      getApiErrorMessage(error).toLowerCase().includes('permiso') ||
      getApiErrorMessage(error).toLowerCase().includes('denegado')

    const homePath = role === 'solicitante' ? '/tickets' : '/kanban'

    return (
      <div className="mx-auto max-w-lg py-12 px-4 text-center">
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              {isForbidden ? `Acceso restringido al ticket #${ticketId}` : 'Ticket no disponible'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isForbidden
                ? 'No tienes permisos para consultar este ticket porque pertenece a otro grupo o técnico.'
                : getApiErrorMessage(error) || 'No fue posible cargar los detalles del ticket.'}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2">
            <Button type="button" onClick={() => navigate(homePath)} className="gap-2">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Ir a la vista principal
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/tickets')}>
              Ver mis tickets
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const type = TICKET_TYPES.find((item) => item.value === ticket.type)?.label ?? ticket.typeLabel
  const isAssigned =
    currentUser?.userId != null &&
    ticket.assigneeIds.some((uid) => Number(uid) === Number(currentUser.userId))

  const canReopen =
    role === 'admin'
      ? ticket.status === 5 || ticket.status === 6
      : ticket.status === 5 && (isAssigned || role === 'supervisor')

  const canClaimHere = !isRequester && ticket.assigneeIds.length === 0 && (ticket.status === 1 || ticket.status === 2)

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        backHref="/tickets"
        backLabel={isRequester ? 'Volver a mis tickets' : 'Volver a tickets'}
        title={
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-snug">
              <span className="font-mono text-muted-foreground mr-2">#{ticket.id}</span>
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <Badge variant="outline" className="text-xs font-medium">
                {type}
              </Badge>
              {ticket.groupName && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {ticket.groupName}
                </Badge>
              )}
            </div>
          </div>
        }
        breadcrumbs={[
          { label: 'Inicio', href: '/' },
          { label: 'Tickets', href: '/tickets' },
          { label: `#${ticket.id}` },
        ]}
      />

      {/* ITIL Lifecycle Progress Stepper */}
      <TicketStatusStepper status={ticket.status} />

      {/* Main 2-Column Layout: Content & Timeline (2/3) + Actions & Metadata (1/3) */}
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        {/* Left Column (2/3) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Descripción */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>Descripción del problema</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {ticket.content ? (
                <RichContent content={ticket.content} />
              ) : (
                <p className="text-sm text-muted-foreground italic">Sin descripción registrada.</p>
              )}
            </CardContent>
          </Card>

          {/* Solución Aplicada */}
          {ticket.solutions && ticket.solutions.length > 0 && (
            <Card className="border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
              <CardHeader className="pb-3 border-b border-emerald-200/70 dark:border-emerald-800/50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <CardTitle className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                    Solución aplicada
                  </CardTitle>
                  <Badge className="ml-auto bg-emerald-600 text-white hover:bg-emerald-600 text-[11px]">
                    Solución
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {ticket.solutions.map((sol) => {
                  const authorName = getTechName(sol.userId)
                  return (
                    <div
                      key={sol.id}
                      className="rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 bg-card p-3.5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Avatar name={authorName} size="xs" tone="success" />
                        <span className="font-semibold text-foreground">{authorName}</span>
                        <span>· {formatDateTime(sol.createdAt)}</span>
                      </div>
                      <RichContent content={sol.content} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Tareas de GLPI */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>Tareas de GLPI</span>
              </CardTitle>
              {tasks && tasks.length > 0 && (
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {tasks.length}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {tasksLoading ? (
                <Skeleton className="h-20 w-full rounded-lg" />
              ) : tasksFailed ? (
                <p role="alert" className="text-sm text-destructive">
                  No se pudo consultar el calendario de tareas: {getApiErrorMessage(tasksError)}
                </p>
              ) : !tasks?.length ? (
                <EmptyState
                  icon={CalendarClock}
                  compact
                  title="No hay tareas registradas en GLPI."
                  description={
                    isRequester
                      ? 'Las intervenciones técnicas planificadas por el equipo aparecerán aquí.'
                      : 'Planifica una tarea para programar la intervención y cambiar el ticket a En proceso.'
                  }
                />
              ) : (
                <ol className="space-y-3" data-testid="ticket-tasks-timeline">
                  {[...tasks]
                    .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? '') || a.id - b.id)
                    .map((task) => {
                      const techName = getTechName(task.technicianId)
                      const isDone = task.state === 2
                      const isTodo = task.state === 1
                      return (
                        <li
                          key={task.id}
                          className={cn(
                            'rounded-lg border p-3.5 space-y-2',
                            isDone
                              ? 'border-emerald-200/80 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/15'
                              : isTodo
                                ? 'border-blue-200/80 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-950/15'
                                : 'border-border bg-surface-subtle/50',
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-semibold text-foreground">Tarea #{task.id}</span>
                              <Badge
                                variant={isDone ? 'secondary' : 'outline'}
                                className={cn(
                                  'text-[11px]',
                                  isDone && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
                                  isTodo && 'border-blue-300 bg-blue-100/70 text-blue-900 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-200',
                                )}
                              >
                                {isDone ? 'Realizada' : isTodo ? 'Por hacer' : 'Información'}
                              </Badge>
                              {task.isPrivate ? (
                                <Badge variant="secondary" className="gap-1 text-[10px]">
                                  <Lock className="size-2.5" aria-hidden="true" />
                                  Privada
                                </Badge>
                              ) : null}
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              <Avatar name={techName} size="xs" />
                              <span className="font-medium text-foreground">{techName}</span>
                            </span>
                          </div>

                          <RichContent content={task.content} />

                          {task.startAt && task.endAt && (
                            <p className="inline-flex items-center gap-1.5 rounded-md bg-background/80 border border-border/70 px-2 py-1 text-xs text-muted-foreground font-mono">
                              <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
                              <span>
                                {formatDateTime(task.startAt)} – {formatDateTime(task.endAt)}
                              </span>
                            </p>
                          )}

                          {task.state === 1 && ticket.status >= 5 && (
                            <p className="text-xs text-muted-foreground italic">
                              Ticket finalizado; la tarea es de sólo lectura.
                            </p>
                          )}
                          {task.state === 1 && ticket.status === 1 && (
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                              Asigna el ticket antes de interactuar con sus tareas.
                            </p>
                          )}
                          {task.state === 1 &&
                            ticket.status >= 2 &&
                            ticket.status <= 4 &&
                            role === 'technician' &&
                            currentUser?.userId !== task.technicianId && (
                              <p className="text-xs text-muted-foreground italic">
                                Tarea asignada a {techName}. Solo el técnico responsable o un supervisor/administrador pueden completarla.
                              </p>
                            )}
                          {task.state === 1 &&
                            ticket.status >= 2 &&
                            ticket.status <= 4 &&
                            (role === 'admin' ||
                              role === 'supervisor' ||
                              (currentUser?.userId === task.technicianId &&
                                ticket.assigneeIds.includes(task.technicianId))) && (
                              <div className="pt-1 flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => setReplanTask(task)}>
                                  Reprogramar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => setTaskAction({ taskId: task.id, action: 'complete' })}
                                >
                                  Completar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setTaskAction({ taskId: task.id, action: 'cancel' })}
                                >
                                  Cancelar tarea
                                </Button>
                              </div>
                            )}
                        </li>
                      )
                    })}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Historial y Seguimiento */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>Historial y Seguimiento</span>
              </CardTitle>
              {ticket.followups.length > 0 && (
                <Badge variant="secondary" className="text-[11px] tabular-nums">
                  {ticket.followups.length}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {ticket.followups.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Sin seguimientos registrados.</p>
              ) : (
                <ol className="space-y-3">
                  {ticket.followups.map((followup) => {
                    const authorName = getTechName(followup.userId)
                    return (
                      <li
                        key={followup.id}
                        className={cn(
                          'rounded-lg border p-3.5 space-y-2',
                          followup.isPrivate
                            ? 'border-amber-200 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/15'
                            : 'border-border bg-surface-subtle/40',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar name={authorName} size="xs" />
                            <span className="font-semibold text-foreground">{authorName}</span>
                            {followup.isPrivate ? (
                              <Badge
                                variant="outline"
                                className="gap-1 text-[10px] border-amber-300 bg-amber-100/70 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                              >
                                <Lock className="size-2.5" aria-hidden="true" />
                                Privado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Público
                              </Badge>
                            )}
                          </div>
                          <span className="tabular-nums">{formatDateTime(followup.createdAt)}</span>
                        </div>
                        <RichContent content={followup.content} />
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3): Actions + Structured Metadata Rail */}
        <div className="space-y-4">
          {role === 'solicitante' ? (
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70">
                <CardTitle className="text-sm font-semibold">Estado del ticket en GLPI</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <StatusBadge status={ticket.status} />
                <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {ticket.status === 6
                    ? 'Este ticket está cerrado definitivamente. Puedes consultar todo el historial y la solución aplicada en modo solo lectura.'
                    : ticket.status === 5
                      ? 'El equipo de soporte registró una solución. Revisa la sección "Solución aplicada" para validar los detalles.'
                      : ticket.status === 4
                        ? 'Tu ticket está en espera de información o confirmación adicional. Revisa el seguimiento más reciente.'
                        : 'El equipo de soporte actualiza este estado en tiempo real. Aquí puedes consultar el avance y la solución.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card shadow-xs">
              <CardHeader className="pb-3 border-b border-border/70">
                <CardTitle className="text-sm font-semibold">Cambiar estado</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {ticket.status === 6 && (
                  <div
                    className="space-y-1.5 rounded-lg border border-border bg-surface-subtle p-3 text-xs text-muted-foreground"
                    data-testid="closed-readonly-banner"
                  >
                    <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                      <Lock className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                      <span>Ticket Cerrado (Modo lectura)</span>
                    </div>
                    <p className="leading-relaxed">
                      {role === 'admin'
                        ? 'Este ticket está cerrado de forma definitiva. Las modificaciones directas están bloqueadas; como administrador conservas la facultad de reabrirlo formalmente registrando el motivo de auditoría.'
                        : 'Este ticket está cerrado de forma definitiva. No se admiten modificaciones ni reapertura por técnicos.'}
                    </p>
                  </div>
                )}

                {ticket.status === 5 && (
                  <div
                    className="space-y-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-950 dark:text-emerald-200"
                    data-testid="resolved-banner"
                  >
                    <div className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      <span>Ticket Resuelto</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      La solución ha sido registrada en GLPI. El cierre automático definitivo lo gestiona la acción programada closeticket de GLPI.
                    </p>
                  </div>
                )}

                {ticket.status === 4 && (
                  <div className="space-y-2.5 rounded-lg border border-amber-300/70 bg-amber-50/70 p-3 text-xs text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/25 dark:text-amber-100">
                    <p className="leading-relaxed">
                      Este ticket está en espera. Reanúdalo a <strong>Asignado</strong> antes de editar una tarea
                      existente. Para volver a <strong>En proceso (planificado)</strong>, GLPI debe confirmar una
                      planificación nativa.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-9 w-full rounded-lg border-amber-500/60 bg-background"
                      disabled={updateStatus.isPending}
                      onClick={() => changeStatus(2)}
                      data-testid="resume-waiting-ticket-btn"
                    >
                      Reanudar a Asignado
                    </Button>
                  </div>
                )}

                {/* Primary Workflow Actions */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Acciones principales
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {canClaimHere && (
                      <Button
                        size="sm"
                        variant="default"
                        loading={claimTicket.isPending}
                        onClick={handleClaim}
                        data-testid="detail-claim-ticket-btn"
                        className="gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="size-3.5" aria-hidden="true" />
                        <span>Asignarme</span>
                      </Button>
                    )}

                    {ticket.status === 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/50 text-primary hover:bg-primary/10 cursor-pointer"
                        disabled={ticket.assigneeIds.length === 0 || updateStatus.isPending}
                        data-testid="start-ticket-btn"
                        title={
                          ticket.assigneeIds.length === 0
                            ? 'Asigna un técnico antes de planificar.'
                            : undefined
                        }
                        onClick={() => setPlanOpen(true)}
                      >
                        Planificar tarea
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="default"
                      className="cursor-pointer"
                      disabled={
                        ticket.assigneeIds.length === 0 ||
                        (ticket.status !== 2 && ticket.status !== 3) ||
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
                      className="cursor-pointer"
                      disabled={
                        ticket.assigneeIds.length === 0 ||
                        ticket.status === 4 ||
                        ticket.status === 5 ||
                        ticket.status === 6 ||
                        updateStatus.isPending
                      }
                      onClick={() => setPendingOpen(true)}
                      data-testid="pending-ticket-btn"
                    >
                      Poner en pendiente
                    </Button>

                    {canReopen && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        data-testid="reopen-ticket-btn"
                        onClick={() => setReopenOpen(true)}
                      >
                        Reabrir
                      </Button>
                    )}
                  </div>
                </div>

                {/* Secondary GLPI Direct State Controls (visually separated for clarity) */}
                <div className="pt-3 border-t border-border/70 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Estados GLPI
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TICKET_STATUSES.map((option) => {
                      const isClosedDirectTransitionBlocked = ticket.status === 6

                      const isBackwardBlocked =
                        role !== 'admin' &&
                        ((ticket.status === 5 && option.value < 5) ||
                          (ticket.status === 6 && option.value <= 5))

                      const isPendingInvalidTransition = ticket.status === 4 && option.value !== 2

                      const isAssigneeDirectResolveBlocked =
                        option.value === 5 && ticket.status !== 2 && ticket.status !== 3

                      const isRewindToNewBlocked =
                        role !== 'admin' && ticket.status > 1 && option.value === 1

                      const isCloseAdminOnly = role !== 'admin' && option.value === 6

                      const isCloseUnsolvedBlocked = option.value === 6 && ticket.status !== 5

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
                          className="h-7 px-2.5 text-[11px]"
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
                </div>

                {ticket.status === 2 && !hasActionableTask && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Primero debes planificar y realizar al menos una tarea en GLPI para poder resolverlo.
                  </p>
                )}
                {ticket.status === 4 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                    Reanuda el ticket a Asignado o replanifica su tarea antes de resolverlo.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Structured Ticket Metadata Panel */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">Detalles del Ticket</CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs divide-y divide-border/60">
              {ticket.groupName && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">Grupo</span>
                  <span className="font-semibold text-foreground">{ticket.groupName}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-muted-foreground">Urgencia / Impacto</span>
                <span className="font-medium text-foreground">
                  {urgencyLabel(ticket.urgency)} / {impactLabel(ticket.impact)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-muted-foreground">Creado</span>
                <span className="font-medium text-foreground tabular-nums">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-muted-foreground">Actualizado</span>
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Clock className="size-3 text-muted-foreground" aria-hidden="true" />
                  {formatRelative(ticket.updatedAt, currentTime)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-muted-foreground">Resuelto</span>
                <span className="font-medium text-foreground tabular-nums">
                  {ticket.solvedAt ? formatDateTime(ticket.solvedAt) : '—'}
                </span>
              </div>
              {ticket.closedAt && (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">Cerrado</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {formatDateTime(ticket.closedAt)}
                  </span>
                </div>
              )}
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-muted-foreground shrink-0">Técnicos asignados</span>
                <span className="font-medium text-foreground text-right">
                  {ticket.assigneeIds.length > 0 ? (
                    ticket.assigneeIds.map((userId) => getTechName(userId)).join(', ')
                  ) : (
                    <span className="italic text-muted-foreground">
                      En cola del grupo (sin técnico asignado)
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 py-2.5">
                <span className="text-muted-foreground shrink-0">Solicitantes</span>
                <span className="font-medium text-foreground text-right">
                  {ticket.requesterIds
                    .map((userId) =>
                      userId === currentUser?.userId
                        ? `${currentUser.displayName || currentUser.username} (yo)`
                        : (ticket.participantNames?.[userId] ?? `Usuario no disponible (#${userId})`),
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
      <ConfirmDialog
        open={taskAction !== null}
        onClose={() => setTaskAction(null)}
        onConfirm={() => void confirmTaskAction()}
        title={taskAction?.action === 'complete' ? 'Completar tarea' : 'Cancelar tarea'}
        description={
          taskAction?.action === 'complete'
            ? 'GLPI marcará la tarea como realizada. Se volverá a consultar el estado del ticket.'
            : 'GLPI eliminará esta tarea. Según la versión y configuración, puede ser definitivo. Confirma solo si estás seguro.'
        }
        confirmLabel="Confirmar en GLPI"
        cancelLabel="Volver"
        variant={taskAction?.action === 'cancel' ? 'destructive' : 'default'}
        loading={completeTask.isPending || cancelTask.isPending}
      />
    </div>
  )
}
