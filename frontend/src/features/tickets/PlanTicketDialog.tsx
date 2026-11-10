import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarClock,
  PlusCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  usePlanTicketMutation,
  useReplanTicketTaskMutation,
  useTicketTasksQuery,
  useTicketQuery,
} from '@/hooks/useTickets'
import { getPlanningAvailability, type TicketTask } from '@/lib/api/tickets'
import { useAuthStore } from '@/store/authStore'
import {
  getApiConflictDetails,
  getApiErrorMessage,
  getApiErrorTitle,
  type ApiConflictDetails,
} from '@/lib/api/errors'
import { toPlainText } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { localDateTime, offsetDateTime, parseUnambiguousLocal } from './planningDates'
import { PlanningDateTimeField } from './PlanningDateTimeField'
import { VisualScheduleSelector } from './VisualScheduleSelector'

type PlanMode = 'reschedule' | 'new'

const NO_CHANGES =
  'El horario y el comentario no cambiaron. GLPI solo reanuda un ticket Pendiente cuando la tarea se modifica: ajusta la fecha, la duración o el comentario.'

function formatInterval(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return 'sin horario'
  const format = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' })
  return `${format.format(new Date(startAt))} → ${format.format(new Date(endAt))}`
}

function pickInitialTask(tasks: TicketTask[]): TicketTask | null {
  const scheduled = tasks
    .filter((task) => task.startAt && task.endAt)
    .sort((a, b) => new Date(b.startAt!).getTime() - new Date(a.startAt!).getTime())
  return scheduled[0] ?? tasks[0] ?? null
}

export function PlanTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [technicianId, setTechnicianId] = useState(0)
  const user = useAuthStore((state) => state.user)
  const [mode, setMode] = useState<PlanMode>('new')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [ready, setReady] = useState(false)
  const [conflict, setConflict] = useState<ApiConflictDetails | null>(null)
  const requestId = useRef<string | null>(null)
  const submitting = useRef(false)
  const initialized = useRef(false)
  const planning = usePlanTicketMutation()
  const replanning = useReplanTicketTaskMutation()
  const tasksQuery = useTicketTasksQuery(ticketId, open)
  const ticketQuery = useTicketQuery(ticketId)
  const pushToast = useToastStore((state) => state.push)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const ticket = ticketQuery.data
  const openTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => task.state === 1),
    [tasksQuery.data],
  )
  const selectedTask = openTasks.find((task) => task.id === selectedTaskId) ?? null
  const busy = planning.isPending || replanning.isPending || checking

  useEffect(() => {
    if (!open) {
      initialized.current = false
      setReady(false)
      submitting.current = false
      setContent('')
      setTechnicianId(0)
      setError('')
      setConflict(null)
      return
    }
    if (initialized.current || tasksQuery.isLoading || tasksQuery.isError) return
    const initial = new Date(Math.ceil((Date.now() + 15 * 60_000) / 300_000) * 300_000)
    const task = pickInitialTask(openTasks)
    if (task) {
      setMode('reschedule')
      setSelectedTaskId(task.id)
      setContent(toPlainText(task.content))
      setStart(task.startAt ? localDateTime(new Date(task.startAt)) : localDateTime(initial))
      setEnd(
        task.endAt
          ? localDateTime(new Date(task.endAt))
          : localDateTime(new Date(initial.getTime() + 60 * 60_000)),
      )
    } else {
      setMode('new')
      setSelectedTaskId(null)
      setContent('')
      setStart('')
      setEnd('')
    }
    setError('')
    setConflict(null)
    requestId.current = uuidv4()
    initialized.current = true
    setReady(true)
  }, [open, openTasks, tasksQuery.isLoading, tasksQuery.isError])

  const switchMode = (next: PlanMode) => {
    if (busy || tasksUnavailable || next === mode) return
    setMode(next)
    setError('')
    setConflict(null)
    if (next === 'new') {
      setSelectedTaskId(null)
      setContent('')
      setStart('')
      setEnd('')
      return
    }
    const task = openTasks.find((item) => item.id === selectedTaskId) ?? pickInitialTask(openTasks)
    if (!task) return
    setSelectedTaskId(task.id)
    setContent(toPlainText(task.content))
    if (task.startAt) setStart(localDateTime(new Date(task.startAt)))
    if (task.endAt) setEnd(localDateTime(new Date(task.endAt)))
  }

  const applySuggestedStart = (iso: string) => {
    const suggested = new Date(iso)
    const startDate = parseUnambiguousLocal(start)
    const endDate = parseUnambiguousLocal(end)
    const duration =
      startDate && endDate && endDate > startDate
        ? endDate.getTime() - startDate.getTime()
        : 60 * 60_000
    setStart(localDateTime(suggested))
    setEnd(localDateTime(new Date(suggested.getTime() + duration)))
    setConflict(null)
    setError('')
  }

  const adoptOwnTask = (taskId: number) => {
    const task = openTasks.find((item) => item.id === taskId)
    setMode('reschedule')
    setSelectedTaskId(taskId)
    setError('')
    setConflict(null)
    if (!task) return
    setContent(toPlainText(task.content))
    if (task.startAt) setStart(localDateTime(new Date(task.startAt)))
    if (task.endAt) setEnd(localDateTime(new Date(task.endAt)))
  }

  const responsibleId = mode === 'reschedule' ? selectedTask?.technicianId ?? 0
    : technicianId || (ticket?.assigneeIds.length === 1 ? ticket.assigneeIds[0] : 0)
  const startDateObj = parseUnambiguousLocal(start)
  const endDateObj = parseUnambiguousLocal(end)
  const isEndBeforeStart = Boolean(startDateObj && endDateObj && endDateObj <= startDateObj)
  const isPastStart = Boolean(startDateObj && startDateObj.getTime() < Date.now() - 5 * 60_000)
  const startIso = startDateObj ? offsetDateTime(startDateObj) : ''
  const endIso = endDateObj ? offsetDateTime(endDateObj) : ''
  const excludeTaskId = mode === 'reschedule' ? selectedTask?.id : undefined
  const availability = useQuery({
    queryKey: ['tickets', 'availability', ticketId, responsibleId, startIso, endIso, excludeTaskId],
    queryFn: ({ signal }) => getPlanningAvailability(ticketId, responsibleId, startIso, endIso, excludeTaskId, signal),
    enabled: open && ready && responsibleId > 0 && !!startIso && !!endIso && !isEndBeforeStart,
    staleTime: 0,
    refetchInterval: open ? 15_000 : false,
    retry: false,
  })

  const durationMinutes = useMemo(() => {
    if (!startDateObj || !endDateObj || endDateObj <= startDateObj) return 60
    return Math.round((endDateObj.getTime() - startDateObj.getTime()) / 60_000)
  }, [startDateObj, endDateObj])

  const isSameSchedule = useMemo(() => {
    if (mode !== 'reschedule' || !selectedTask) return false
    const effectiveContent = content.trim() || 'Intervención planificada'
    const origStart = selectedTask.startAt ? new Date(selectedTask.startAt).getTime() : 0
    const origEnd = selectedTask.endAt ? new Date(selectedTask.endAt).getTime() : 0
    const currStart = startDateObj ? startDateObj.getTime() : 0
    const currEnd = endDateObj ? endDateObj.getTime() : 0
    return (
      toPlainText(selectedTask.content).trim() === effectiveContent &&
      origStart === currStart &&
      origEnd === currEnd
    )
  }, [mode, selectedTask, content, startDateObj, endDateObj])

  const close = () => {
    if (!busy) onOpenChange(false)
  }

  const tasksUnavailable = tasksQuery.isLoading || tasksQuery.isError || !ready

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || busy) return
    if (!responsibleId) {
      setError('Selecciona un técnico asignado al ticket antes de planificar.')
      return
    }
    if (tasksQuery.isError) {
      setError(
        'No se pudieron leer las tareas GLPI del ticket. Reintenta la carga antes de guardar para no duplicar la tarea existente.',
      )
      return
    }
    if (tasksQuery.isLoading) {
      setError('Esperando la lista de tareas de GLPI; vuelve a intentarlo en un momento.')
      return
    }
    if (mode === 'reschedule' && !selectedTask) {
      setError('Selecciona la tarea que quieres reprogramar.')
      return
    }
    const startDate = parseUnambiguousLocal(start)
    const endDate = parseUnambiguousLocal(end)
    if (!startDate || !endDate) {
      setError('La fecha/hora no existe o es ambigua por el cambio de horario. Elige otra hora.')
      return
    }
    if (
      endDate.getTime() <= startDate.getTime() ||
      endDate.getTime() - startDate.getTime() > 30 * 86_400_000
    ) {
      setError('La fecha y hora de fin debe ser posterior al inicio (máximo 30 días).')
      return
    }
    if (endDate.getTime() - startDate.getTime() < 60_000) {
      setError('La intervención debe programarse con al menos 1 minuto de duración.')
      return
    }
    if (content.trim().length > 4000) {
      setError('El comentario no puede superar los 4000 caracteres.')
      return
    }
    const effectiveContent = content.trim() || 'Intervención planificada'
    if (
      mode === 'reschedule' &&
      selectedTask &&
      toPlainText(selectedTask.content).trim() === effectiveContent &&
      selectedTask.startAt &&
      new Date(selectedTask.startAt).getTime() === startDate.getTime() &&
      selectedTask.endAt &&
      new Date(selectedTask.endAt).getTime() === endDate.getTime()
    ) {
      setError(NO_CHANGES)
      return
    }
    setError('')
    setConflict(null)
    submitting.current = true
    setChecking(true)
    try {
      const checked = await availability.refetch()
      if (checked.isError) throw checked.error
      if (!checked.data?.available) {
        setError('El horario está ocupado. Elige un intervalo libre antes de confirmar.')
        return
      }
      if (mode === 'reschedule' && selectedTask) {
        await replanning.mutateAsync({
          ticketId,
          taskId: selectedTask.id,
          payload: {
            technicianId: responsibleId,
            requestId: requestId.current ?? uuidv4(),
            content: effectiveContent,
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString(),
          },
        })
        pushToast({
          title: 'Ticket replanificado en GLPI',
          description: `Tarea GLPI #${selectedTask.id} actualizada sin duplicados. Estado En proceso (planificado) confirmado.`,
          variant: 'success',
        })
      } else {
        const result = await planning.mutateAsync({
          ticketId,
          payload: {
            technicianId: responsibleId,
            requestId: requestId.current ?? uuidv4(),
            content: effectiveContent,
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString(),
            createNewTask: true,
          },
        })
        pushToast({
          title: 'Ticket planificado',
          description: `Tarea GLPI #${result.taskId} creada y estado En proceso (planificado) confirmado.`,
          variant: 'success',
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(getApiErrorMessage(err))
      const details = getApiConflictDetails(err)
      setConflict(details && details.conflicts.length > 0 ? details : null)
      void tasksQuery.refetch()
      pushToast({
        title: getApiErrorTitle(err, 'No se pudo confirmar la planificación'),
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      submitting.current = false
      setChecking(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={`Planificación asistida · Ticket #${ticketId}`}
      description="Elige al responsable, revisa su agenda y confirma una franja libre."
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Ticket Context Header Card */}
        {ticket && (
          <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">{ticket.title}</h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 shrink-0">
                {ticket.priorityLabel || `Prioridad ${ticket.priority}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {ticket.groupName && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <Layers className="size-3 text-primary" />
                  {ticket.groupName}
                </span>
              )}
              <span>Estado: <strong className="text-foreground">{ticket.statusLabel}</strong></span>
              <span>Urgencia: <strong className="text-foreground">{ticket.urgency}</strong></span>
            </div>
          </div>
        )}

        {tasksQuery.isError && (
          <div
            role="alert"
            className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-red-700 dark:text-red-400"
          >
            <p className="font-medium">No se pudieron cargar las tareas GLPI de este ticket.</p>
            <p className="text-foreground/80">
              No se enviará nada para evitar duplicar una tarea existente. Reintenta la lectura antes de guardar.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => void tasksQuery.refetch()}>
              Reintentar carga de tareas
            </Button>
          </div>
        )}

        {(tasksQuery.isLoading || !ready) && !tasksQuery.isError && (
          <p role="status" className="text-xs text-muted-foreground">Preparando formulario y tareas GLPI del ticket…</p>
        )}

        {/* Mode Selector */}
        {openTasks.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchMode('reschedule')}
              disabled={busy || tasksUnavailable}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                mode === 'reschedule'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-border/70 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">Reprogramar tarea existente</span>
                <span className="block text-[11px] text-muted-foreground">
                  Conserva la tarea GLPI e historial; reanuda el ticket Pendiente a En proceso.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('new')}
              disabled={busy || tasksUnavailable}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                mode === 'new'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-border/70 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <PlusCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">Crear nueva tarea</span>
                <span className="block text-[11px] text-muted-foreground">
                  Solo si la intervención anterior ya no aplica. No sobrescribe tareas previas.
                </span>
              </span>
            </button>
          </div>
        )}

        {mode === 'reschedule' && openTasks.length > 1 && (
          <div className="space-y-1">
            <Label htmlFor="plan-task">Tarea a reprogramar</Label>
            <select
              id="plan-task"
              value={selectedTaskId ?? ''}
              disabled={busy || tasksUnavailable}
              onChange={(event) => {
                const task = openTasks.find((item) => item.id === Number(event.target.value))
                if (!task) return
                setSelectedTaskId(task.id)
                setContent(toPlainText(task.content))
                if (task.startAt) setStart(localDateTime(new Date(task.startAt)))
                if (task.endAt) setEnd(localDateTime(new Date(task.endAt)))
                setError('')
                setConflict(null)
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {openTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  #{task.id} · {formatInterval(task.startAt, task.endAt)} · {toPlainText(task.content).slice(0, 48)}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === 'reschedule' && selectedTask && (
          <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              Tarea #{selectedTask.id} actualmente programada en{' '}
              <span className="font-mono text-foreground">{formatInterval(selectedTask.startAt, selectedTask.endAt)}</span>.
              Al confirmar un cambio real, GLPI actualizará la programación sin colisionar consigo misma.
            </span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="plan-technician">Técnico responsable</Label>
          <select id="plan-technician" value={responsibleId || ''}
            disabled={busy || tasksUnavailable || mode === 'reschedule'}
            onChange={(event) => { setTechnicianId(Number(event.target.value)); setError(''); setConflict(null) }}
            className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Selecciona un técnico asignado</option>
            {[...new Set([...(ticket?.assigneeIds ?? []), ...(selectedTask && mode === 'reschedule' ? [selectedTask.technicianId] : [])])]
              .filter(id => user?.role !== 'technician' || id === user.userId)
              .map(id => <option key={id} value={id}>{ticket?.participantNames?.[id]
                ?? (id === user?.userId ? user.displayName || user.username : `Usuario no disponible (#${id})`)}</option>)}
          </select>
          {!ticket?.assigneeIds.length && <p role="alert" className="text-sm text-red-700 dark:text-red-400">Asigna un técnico al ticket antes de programar.</p>}
          {mode === 'reschedule' && <p className="text-xs text-muted-foreground">Se conserva el responsable de la tarea existente.</p>}
        </div>

        {/* Selector visual de agenda interactiva y accesible */}
        <VisualScheduleSelector
          selectedStart={startDateObj}
          durationMinutes={durationMinutes}
          onSlotSelect={(newStart, newDuration) => {
            if (!newStart) {
              setStart('')
              setEnd('')
              return
            }
            setStart(localDateTime(newStart))
            setEnd(localDateTime(new Date(newStart.getTime() + newDuration * 60_000)))
            setError('')
            setConflict(null)
          }}
          busyPeriods={availability.data?.busy}
          suggestedStart={availability.data?.suggestedStart}
          isAvailable={availability.data?.available ?? true}
          isFetchingAvailability={availability.isFetching}
          timeZone={zone}
          technicianName={ticket?.participantNames?.[responsibleId] ?? (responsibleId === user?.userId ? user.displayName || user.username : undefined)}
          disabled={busy || tasksUnavailable || !responsibleId}
          manualInputSection={
            <div className="grid gap-2">
              <PlanningDateTimeField
                id="plan-start"
                label="Fecha y hora de inicio"
                value={start}
                onChange={setStart}
                testId="plan-start"
                disabled={busy || tasksUnavailable}
              />
              <PlanningDateTimeField
                id="plan-end"
                label="Fecha y hora de fin"
                value={end}
                onChange={setEnd}
                testId="plan-end"
                disabled={busy || tasksUnavailable}
              />
            </div>
          }
        />

        {/* Immediate validation indicators */}
        {isEndBeforeStart && (
          <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>La fecha de fin debe ser posterior a la fecha de inicio.</span>
          </div>
        )}
        {isPastStart && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Clock className="size-3.5 shrink-0" />
            <span>Aviso: La hora seleccionada es anterior a la actual.</span>
          </div>
        )}

        {/* Existing Open Tasks Mini Agenda */}
        {openTasks.length > 0 && (
          <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-2 text-xs">
            <span className="font-medium text-foreground/80 flex items-center gap-1">
              <Calendar className="size-3 text-primary" />
              Tareas pendientes del ticket ({openTasks.length}):
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {openTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-[11px] text-muted-foreground bg-background/50 px-2 py-1 rounded">
                  <span className="font-mono">#{t.id} · {formatInterval(t.startAt, t.endAt)}</span>
                  <span className="truncate max-w-[140px]">{toPlainText(t.content) || 'Sin notas'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intervention Comments */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="plan-content">Comentario o notas de intervención</Label>
            <span className="text-[11px] text-muted-foreground">Opcional</span>
          </div>
          <Textarea
            id="plan-content"
            maxLength={4000}
            value={content}
            disabled={busy || tasksUnavailable}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Opcional: detalles del trabajo a realizar o instrucciones especiales..."
            data-testid="plan-content"
            className="min-h-[80px]"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">
          Zona horaria: {zone}. La disponibilidad se vuelve a validar al confirmar.
        </p>
        {responsibleId > 0 && <p className="rounded-lg bg-muted/30 p-3 text-sm">
          {ticket?.participantNames?.[responsibleId] ?? 'Técnico seleccionado'} · {formatInterval(startIso, endIso)}
        </p>}

        {error && (
          <div
            role="alert"
            className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-red-700 dark:text-red-400"
          >
            <p className="font-medium">{error}</p>
            {conflict && (
              <>
                <ul className="space-y-0.5 text-foreground/80">
                  {conflict.conflicts.map((item) => (
                    <li key={`${item.ticketId}-${item.taskId}`}>
                      Ticket #{item.ticketId} · tarea #{item.taskId} · {formatInterval(item.startAt, item.endAt)}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  {conflict.suggestedStart && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestedStart(conflict.suggestedStart!)}
                    >
                      Usar horario libre
                    </Button>
                  )}
                  {conflict.ownTaskId != null && mode === 'new' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => adoptOwnTask(conflict.ownTaskId!)}
                    >
                      Reprogramar mi tarea #{conflict.ownTaskId}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {isSameSchedule && (
          <p className="text-xs text-muted-foreground text-center">
            Modifica la fecha, duración o comentario para guardar los cambios.
          </p>
        )}

        <div className="sticky bottom-0 -mx-3 -mb-3 sm:-mx-6 sm:-mb-6 bg-card/95 backdrop-blur-sm border-t border-border/40 p-3 sm:p-4 flex flex-wrap justify-end gap-2 mt-4">
          <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={busy} onClick={close}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="min-h-11 w-full sm:w-auto"
            disabled={busy || tasksUnavailable || !startDateObj || !endDateObj || isEndBeforeStart || !responsibleId || availability.isFetching || !availability.data?.available || availability.isError || isSameSchedule}
            data-testid="plan-confirm-btn"
          >
            {busy
              ? mode === 'reschedule'
                ? 'Reprogramando...'
                : 'Planificando...'
              : tasksUnavailable
                ? 'Esperando tareas GLPI...'
                : mode === 'reschedule'
                  ? 'Guardar nueva programación'
                  : 'Confirmar planificación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
