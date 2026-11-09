import { useEffect, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CalendarClock, Clock, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReplanTicketTaskMutation, useTechniciansQuery } from '@/hooks/useTickets'
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

const NO_CHANGES =
  'El horario y el comentario no cambiaron. GLPI solo reanuda un ticket Pendiente cuando la tarea se modifica: ajusta la fecha, la duración o el comentario.'

function formatInterval(startAt: string | null, endAt: string | null) {
  if (!startAt || !endAt) return 'sin horario'
  const format = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' })
  return `${format.format(new Date(startAt))} → ${format.format(new Date(endAt))}`
}

export function ReplanTicketTaskDialog({ ticketId, task, onClose }: {
  ticketId: number
  task: TicketTask | null
  onClose: () => void
}) {
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState<ApiConflictDetails | null>(null)
  const requestId = useRef<string | null>(null)
  const submitting = useRef(false)
  const mutation = useReplanTicketTaskMutation()
  const pushToast = useToastStore((state) => state.push)
  const { data: technicians } = useTechniciansQuery()

  const techName = task?.technicianId
    ? technicians?.find((t) => t.id === task.technicianId)?.displayName ||
      technicians?.find((t) => t.id === task.technicianId)?.username ||
      'Especialista de Soporte'
    : '—'

  useEffect(() => {
    if (!task) return
    setContent(toPlainText(task.content))
    setStart(task.startAt ? localDateTime(new Date(task.startAt)) : '')
    setEnd(task.endAt ? localDateTime(new Date(task.endAt)) : '')
    setError('')
    setConflict(null)
    requestId.current = uuidv4()
  }, [task])

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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!task || submitting.current || mutation.isPending) return
    const startDate = parseUnambiguousLocal(start)
    const endDate = parseUnambiguousLocal(end)
    if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) {
      setError('Indica fechas válidas, inequívocas y con el fin posterior al inicio.')
      return
    }
    const duration = endDate.getTime() - startDate.getTime()
    if (duration < 60_000 || duration > 30 * 86_400_000 || content.trim().length > 4000) {
      setError('La duración debe ser de entre 1 minuto y 30 días (comentario máximo 4000 caracteres).')
      return
    }
    const effectiveContent = content.trim() || 'Intervención planificada'
    if (toPlainText(task.content).trim() === effectiveContent
      && task.startAt && new Date(task.startAt).getTime() === startDate.getTime()
      && task.endAt && new Date(task.endAt).getTime() === endDate.getTime()) {
      setError(NO_CHANGES)
      return
    }
    setError('')
    setConflict(null)
    submitting.current = true
    try {
      await mutation.mutateAsync({ ticketId, taskId: task.id, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: effectiveContent,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      } })
      pushToast({
        title: `Tarea #${task.id} reprogramada en GLPI`,
        description: 'Estado En proceso (planificado) confirmado por GLPI.',
        variant: 'success',
      })
      onClose()
    } catch (mutationError) {
      setError(getApiErrorMessage(mutationError))
      const details = getApiConflictDetails(mutationError)
      setConflict(details && details.conflicts.length > 0 ? details : null)
      pushToast({ title: getApiErrorTitle(mutationError, 'No se pudo reprogramar'),
        description: getApiErrorMessage(mutationError), variant: 'destructive' })
    } finally {
      submitting.current = false
    }
  }

  const prevStart = task?.startAt ? new Date(task.startAt).toLocaleString() : 'No definida'
  const prevEnd = task?.endAt ? new Date(task.endAt).toLocaleString() : 'No definida'

  return (
    <Dialog open={task !== null} onClose={() => { if (!mutation.isPending) onClose() }}
      title={`Reprogramar tarea #${task?.id ?? ''}`}
      description="Actualiza la planificación de la intervención técnica en GLPI conservando auditoría e idempotencia. Si el ticket está Pendiente, GLPI lo reanudará a En proceso.">
      <form onSubmit={submit} className="space-y-4">
        {/* Horario Anterior y Técnico */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="size-3.5 text-primary" /> Horario anterior:
            </span>
            <span className="font-mono">{prevStart} → {prevEnd}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="size-3.5 text-primary" /> Técnico asignado:
            </span>
            <span>{techName}</span>
          </div>
          <div className="flex items-start gap-1.5 pt-1 border-t border-border/40 text-muted-foreground">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>Un cambio real de fecha, duración o comentario reanuda el ticket Pendiente sin duplicar tareas.</span>
          </div>
        </div>

        {/* Nuevo Horario */}
        <div className="grid gap-3 lg:grid-cols-2">
          <PlanningDateTimeField id="task-replan-start" label="Nuevo inicio" value={start} onChange={setStart} disabled={mutation.isPending} />
          <PlanningDateTimeField id="task-replan-end" label="Nuevo fin" value={end} onChange={setEnd} disabled={mutation.isPending} />
        </div>

        {/* Atajos de duración */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Ajustar duración:</span>
          {[
            { label: '+30m', minutes: 30 },
            { label: '+1h', minutes: 60 },
            { label: '+2h', minutes: 120 },
            { label: '+4h', minutes: 240 },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => {
                const s = parseUnambiguousLocal(start) ?? new Date()
                setEnd(localDateTime(new Date(s.getTime() + d.minutes * 60_000)))
              }}
              className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Comentario o motivo de replanificación */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-replan-content">Trabajo por realizar</Label>
            <span className="text-[11px] text-muted-foreground">Opcional</span>
          </div>
          <Textarea
            id="task-replan-content"
            value={content}
            maxLength={4000}
            placeholder="Opcional: detalles del trabajo a realizar o motivo de reprogramación..."
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[70px]"
          />
        </div>

        {error && (
          <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
            <p className="font-medium">{error}</p>
            {conflict && conflict.conflicts.length > 0 && (
              <>
                <ul className="space-y-0.5 text-foreground/80">
                  {conflict.conflicts.map((item) => (
                    <li key={`${item.ticketId}-${item.taskId}`}>
                      Ticket #{item.ticketId} · tarea #{item.taskId} · {formatInterval(item.startAt, item.endAt)}
                    </li>
                  ))}
                </ul>
                {conflict.suggestedStart && (
                  <Button type="button" size="sm" variant="outline" onClick={() => applySuggestedStart(conflict.suggestedStart!)}>
                    Usar horario libre
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reprogramando...' : 'Guardar nueva programación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
