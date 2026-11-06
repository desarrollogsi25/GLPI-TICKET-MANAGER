import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CalendarClock, PlusCircle, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePlanTicketMutation, useReplanTicketTaskMutation, useTicketTasksQuery } from '@/hooks/useTickets'
import type { TicketTask } from '@/lib/api/tickets'
import {
  getApiConflictDetails,
  getApiErrorMessage,
  getApiErrorTitle,
  type ApiConflictDetails,
} from '@/lib/api/errors'
import { toPlainText } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { localDateTime, parseUnambiguousLocal } from './planningDates'
import { PlanningDateTimeField } from './PlanningDateTimeField'

type PlanMode = 'reschedule' | 'new'

const NO_CHANGES =
  'El horario y el comentario no cambiaron. GLPI solo reanuda un ticket Pendiente cuando la tarea se modifica: ajusta la fecha, la duración o el comentario.'

const DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: '1 día', minutes: 1440 },
]

function formatInterval(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return 'sin horario'
  const format = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' })
  return `${format.format(new Date(startAt))} → ${format.format(new Date(endAt))}`
}

function pickInitialTask(tasks: TicketTask[]): TicketTask | null {
  const scheduled = tasks
    .filter((task) => task.startAt && task.endAt)
    .sort((a, b) => new Date(b.startAt!).getTime() - new Date(a.startAt!).getTime())
  return scheduled[0] ?? tasks[0] ?? null
}

export function PlanTicketDialog({ ticketId, open, onOpenChange }: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [mode, setMode] = useState<PlanMode>('new')
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<ApiConflictDetails | null>(null)
  const requestId = useRef<string | null>(null)
  const submitting = useRef(false)
  const initialized = useRef(false)
  const planning = usePlanTicketMutation()
  const replanning = useReplanTicketTaskMutation()
  const tasksQuery = useTicketTasksQuery(ticketId, open)
  const pushToast = useToastStore((state) => state.push)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const openTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => task.state === 1),
    [tasksQuery.data],
  )
  const selectedTask = openTasks.find((task) => task.id === selectedTaskId) ?? null
  const busy = planning.isPending || replanning.isPending

  useEffect(() => {
    if (!open) {
      initialized.current = false
      submitting.current = false
      setContent('')
      setError('')
      setConflict(null)
      return
    }
    // Never initialise as "create new" while the task list is unknown: a failed
    // or in-flight read would hide an existing TODO task and duplicate the work.
    if (initialized.current || tasksQuery.isLoading || tasksQuery.isError) return
    const initial = new Date(Math.ceil((Date.now() + 15 * 60_000) / 300_000) * 300_000)
    const task = pickInitialTask(openTasks)
    if (task) {
      setMode('reschedule')
      setSelectedTaskId(task.id)
      setContent(toPlainText(task.content))
      setStart(task.startAt ? localDateTime(new Date(task.startAt)) : localDateTime(initial))
      setEnd(task.endAt
        ? localDateTime(new Date(task.endAt))
        : localDateTime(new Date(initial.getTime() + 60 * 60_000)))
    } else {
      setMode('new')
      setSelectedTaskId(null)
      setContent('')
      setStart(localDateTime(initial))
      setEnd(localDateTime(new Date(initial.getTime() + 60 * 60_000)))
    }
    setError('')
    setConflict(null)
    requestId.current = uuidv4()
    initialized.current = true
  }, [open, openTasks, tasksQuery.isLoading, tasksQuery.isError])

  const switchMode = (next: PlanMode) => {
    if (busy || next === mode) return
    setMode(next)
    setError('')
    setConflict(null)
    if (next === 'new') {
      setSelectedTaskId(null)
      setContent('')
      return
    }
    const task = openTasks.find((item) => item.id === selectedTaskId) ?? pickInitialTask(openTasks)
    if (!task) return
    setSelectedTaskId(task.id)
    setContent(toPlainText(task.content))
    if (task.startAt) setStart(localDateTime(new Date(task.startAt)))
    if (task.endAt) setEnd(localDateTime(new Date(task.endAt)))
  }

  const applyDuration = (minutes: number) => {
    const base = parseUnambiguousLocal(start) ?? new Date()
    setEnd(localDateTime(new Date(base.getTime() + minutes * 60_000)))
  }

  const applySuggestedStart = (iso: string) => {
    const suggested = new Date(iso)
    const startDate = parseUnambiguousLocal(start)
    const endDate = parseUnambiguousLocal(end)
    const duration = startDate && endDate && endDate > startDate
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

  const close = () => {
    if (!busy) onOpenChange(false)
  }

  const tasksUnavailable = tasksQuery.isLoading || tasksQuery.isError

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || busy) return
    if (tasksQuery.isError) {
      setError('No se pudieron leer las tareas GLPI del ticket. Reintenta la carga antes de guardar para no duplicar la tarea existente.')
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
    if (endDate.getTime() <= startDate.getTime() || endDate.getTime() - startDate.getTime() > 30 * 86_400_000) {
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
    if (mode === 'reschedule' && selectedTask
      && toPlainText(selectedTask.content).trim() === effectiveContent
      && selectedTask.startAt && new Date(selectedTask.startAt).getTime() === startDate.getTime()
      && selectedTask.endAt && new Date(selectedTask.endAt).getTime() === endDate.getTime()) {
      setError(NO_CHANGES)
      return
    }
    setError('')
    setConflict(null)
    submitting.current = true
    try {
      if (mode === 'reschedule' && selectedTask) {
        await replanning.mutateAsync({ ticketId, taskId: selectedTask.id, payload: {
          requestId: requestId.current ?? uuidv4(),
          content: effectiveContent,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
        } })
        pushToast({
          title: 'Ticket replanificado en GLPI',
          description: `Tarea GLPI #${selectedTask.id} actualizada sin duplicados. Estado En proceso (planificado) confirmado.`,
          variant: 'success',
        })
      } else {
        const result = await planning.mutateAsync({ ticketId, payload: {
          requestId: requestId.current ?? uuidv4(),
          content: effectiveContent,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString(),
          createNewTask: true,
        } })
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
    }
  }

  return (
    <Dialog open={open} onClose={close} title={`Planificar ticket #${ticketId}`}
      description="Reprograma la tarea GLPI existente para conservar su historial, o crea una tarea nueva si el trabajo anterior ya terminó.">
      <form onSubmit={submit} className="space-y-4">
        {tasksQuery.isError && (
          <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            <p className="font-medium">No se pudieron cargar las tareas GLPI de este ticket.</p>
            <p className="text-foreground/80">
              No se enviará nada para evitar duplicar una tarea existente. Reintenta la lectura antes de guardar.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => void tasksQuery.refetch()}>
              Reintentar carga de tareas
            </Button>
          </div>
        )}

        {tasksQuery.isLoading && (
          <p className="text-[11px] text-muted-foreground">Cargando tareas GLPI del ticket…</p>
        )}

        {openTasks.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => switchMode('reschedule')}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${mode === 'reschedule' ? 'border-primary bg-primary/5' : 'border-border/70 bg-muted/20 hover:bg-muted/40'}`}
            >
              <RefreshCw className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">Reprogramar tarea existente</span>
                <span className="block text-[11px] text-muted-foreground">Conserva la tarea GLPI y su historial; es la vía para reanudar un ticket Pendiente.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('new')}
              className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer ${mode === 'new' ? 'border-primary bg-primary/5' : 'border-border/70 bg-muted/20 hover:bg-muted/40'}`}
            >
              <PlusCircle className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium text-foreground">Crear nueva tarea</span>
                <span className="block text-[11px] text-muted-foreground">Solo si la tarea anterior ya no aplica. Las tareas históricas no se borran.</span>
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
              Tarea #{selectedTask.id} actualmente en <span className="font-mono text-foreground">{formatInterval(selectedTask.startAt, selectedTask.endAt)}</span>.
              Si el ticket está Pendiente, GLPI lo reanudará a En proceso al guardar un cambio real.
            </span>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <PlanningDateTimeField id="plan-start" label="Fecha y hora de inicio" value={start} onChange={setStart} testId="plan-start" disabled={busy} />
          <PlanningDateTimeField id="plan-end" label="Fecha y hora de fin" value={end} onChange={setEnd} testId="plan-end" disabled={busy} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Duración estimada:</span>
          {DURATIONS.map((duration) => (
            <button
              key={duration.label}
              type="button"
              onClick={() => applyDuration(duration.minutes)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              +{duration.label}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="plan-content">Comentario o notas de intervención</Label>
            <span className="text-[11px] text-muted-foreground">Opcional</span>
          </div>
          <Textarea
            id="plan-content"
            maxLength={4000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Opcional: detalles del trabajo a realizar o instrucciones especiales..."
            data-testid="plan-content"
            className="min-h-[80px]"
          />
        </div>

        <p className="text-[11px] text-muted-foreground">Zona horaria: {zone}. La programación se sincroniza nativamente con GLPI TicketTask.</p>

        {error && (
          <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
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
                    <Button type="button" size="sm" variant="outline" onClick={() => applySuggestedStart(conflict.suggestedStart!)}>
                      Usar horario libre
                    </Button>
                  )}
                  {conflict.ownTaskId != null && mode === 'new' && (
                    <Button type="button" size="sm" variant="outline" onClick={() => adoptOwnTask(conflict.ownTaskId!)}>
                      Reprogramar mi tarea #{conflict.ownTaskId}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancelar</Button>
          <Button type="submit" disabled={busy || tasksUnavailable} data-testid="plan-confirm-btn">
            {busy
              ? (mode === 'reschedule' ? 'Reprogramando...' : 'Planificando...')
              : tasksUnavailable
                ? 'Esperando tareas GLPI...'
                : (mode === 'reschedule' ? 'Guardar nueva programación' : 'Confirmar planificación')}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
