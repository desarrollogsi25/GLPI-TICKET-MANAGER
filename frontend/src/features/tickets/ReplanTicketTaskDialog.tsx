import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useQuery } from '@tanstack/react-query'
import { Clock, User, CalendarClock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReplanTicketTaskMutation, useTechniciansQuery, useTicketQuery } from '@/hooks/useTickets'
import { getPlanningAvailability, type TicketTask } from '@/lib/api/tickets'
import {
  getApiConflictDetails,
  getApiErrorMessage,
  getApiErrorTitle,
  type ApiConflictDetails,
} from '@/lib/api/errors'
import { toPlainText } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { useAuthStore } from '@/store/authStore'
import { localDateTime, offsetDateTime, parseUnambiguousLocal } from './planningDates'
import { PlanningDateTimeField } from './PlanningDateTimeField'
import { VisualScheduleSelector } from './VisualScheduleSelector'

const NO_CHANGES =
  'El horario, el técnico y el comentario no cambiaron. GLPI solo reanuda un ticket Pendiente cuando la tarea se modifica: ajusta la fecha, la duración, el técnico o el comentario.'

export function ReplanTicketTaskDialog({ ticketId, task, onClose }: {
  ticketId: number
  task: TicketTask | null
  onClose: () => void
}) {
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [selectedTechId, setSelectedTechId] = useState<number>(0)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [conflict, setConflict] = useState<ApiConflictDetails | null>(null)
  const requestId = useRef<string | null>(null)
  const submitting = useRef(false)
  const mutation = useReplanTicketTaskMutation()
  const pushToast = useToastStore((state) => state.push)
  const { data: technicians } = useTechniciansQuery()
  const { data: ticket } = useTicketQuery(ticketId)
  const user = useAuthStore((state) => state.user)

  const busy = mutation.isPending || checking
  const startDate = parseUnambiguousLocal(start)
  const endDate = parseUnambiguousLocal(end)
  const startIso = startDate ? offsetDateTime(startDate) : ''
  const endIso = endDate ? offsetDateTime(endDate) : ''

  const effectiveTechId = selectedTechId || task?.technicianId || 0

  const availability = useQuery({
    queryKey: ['tickets', 'availability', ticketId, effectiveTechId, startIso, endIso, task?.id],
    queryFn: ({ signal }) => getPlanningAvailability(ticketId, effectiveTechId, startIso, endIso, task!.id, signal),
    enabled: !!task && effectiveTechId > 0 && !!startDate && !!endDate && endDate > startDate,
    staleTime: 0,
    refetchInterval: task ? 15_000 : false,
    retry: false,
  })

  const techName = effectiveTechId
    ? ticket?.participantNames?.[effectiveTechId] ||
      technicians?.find((t) => t.id === effectiveTechId)?.displayName ||
      technicians?.find((t) => t.id === effectiveTechId)?.username ||
      'Especialista de Soporte'
    : '—'

  useEffect(() => {
    if (!task) return
    setContent(toPlainText(task.content))
    setStart(task.startAt ? localDateTime(new Date(task.startAt)) : '')
    setEnd(task.endAt ? localDateTime(new Date(task.endAt)) : '')
    setSelectedTechId(task.technicianId)
    setError('')
    setConflict(null)
    requestId.current = uuidv4()
  }, [task])

  const durationMinutes = useMemo(() => {
    if (!startDate || !endDate || endDate <= startDate) return 60
    return Math.round((endDate.getTime() - startDate.getTime()) / 60_000)
  }, [startDate, endDate])

  const isSame = useMemo(() => {
    if (!task || !startDate || !endDate) return false
    const effectiveContent = content.trim() || 'Intervención planificada'
    const origStart = task.startAt ? new Date(task.startAt).getTime() : 0
    const origEnd = task.endAt ? new Date(task.endAt).getTime() : 0
    return (
      toPlainText(task.content).trim() === effectiveContent &&
      origStart === startDate.getTime() &&
      origEnd === endDate.getTime() &&
      effectiveTechId === task.technicianId
    )
  }, [task, content, startDate, endDate, effectiveTechId])

  const canReassignTech = user?.role === 'admin' || user?.role === 'supervisor'

  const availableTechOptions = useMemo(() => {
    const ids = new Set<number>()
    if (task?.technicianId) ids.add(task.technicianId)
    if (ticket?.assigneeIds) {
      for (const id of ticket.assigneeIds) ids.add(id)
    }
    return Array.from(ids)
  }, [task?.technicianId, ticket?.assigneeIds])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!task || submitting.current || mutation.isPending) return
    const sDate = parseUnambiguousLocal(start)
    const eDate = parseUnambiguousLocal(end)
    if (!sDate || !eDate || eDate.getTime() <= sDate.getTime()) {
      setError('Indica fechas válidas, inequívocas y con el fin posterior al inicio.')
      return
    }
    const duration = eDate.getTime() - sDate.getTime()
    if (duration < 60_000 || duration > 30 * 86_400_000 || content.trim().length > 4000) {
      setError('La duración debe ser de entre 1 minuto y 30 días (comentario máximo 4000 caracteres).')
      return
    }
    const effectiveContent = content.trim() || 'Intervención planificada'
    if (isSame) {
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
        setError('El horario está ocupado. Selecciona un intervalo libre.')
        return
      }
      await mutation.mutateAsync({ ticketId, taskId: task.id, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: effectiveContent,
        startAt: sDate.toISOString(),
        endAt: eDate.toISOString(),
        technicianId: effectiveTechId !== task.technicianId ? effectiveTechId : undefined,
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
      setChecking(false)
    }
  }

  const prevStart = task?.startAt ? new Date(task.startAt).toLocaleString() : 'No definida'
  const prevEnd = task?.endAt ? new Date(task.endAt).toLocaleString() : 'No definida'

  return (
    <Dialog open={task !== null} onClose={() => { if (!busy) onClose() }}
      title={`Reprogramar tarea #${task?.id ?? ''}`}
      description="Actualiza la planificación de la intervención técnica en GLPI conservando auditoría e idempotencia. Si el ticket está en espera o pausa, GLPI lo reanudará a En proceso.">
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
              <User className="size-3.5 text-primary" /> Responsable actual:
            </span>
            <span>{techName}</span>
          </div>
          <div className="flex items-start gap-1.5 pt-1 border-t border-border/40 text-muted-foreground">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>Un cambio real de fecha, duración, técnico o comentario reanuda el ticket y actualiza GLPI sin duplicar tareas.</span>
          </div>
        </div>

        {/* Reasignar Técnico (Admin / Supervisor) */}
        {canReassignTech && availableTechOptions.length > 1 && (
          <div className="space-y-1">
            <Label htmlFor="task-replan-tech">Técnico responsable asignado</Label>
            <select
              id="task-replan-tech"
              value={effectiveTechId}
              disabled={busy}
              onChange={(e) => {
                setSelectedTechId(Number(e.target.value))
                setError('')
                setConflict(null)
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {availableTechOptions.map((id) => (
                <option key={id} value={id}>
                  {ticket?.participantNames?.[id] ||
                    technicians?.find((t) => t.id === id)?.displayName ||
                    technicians?.find((t) => t.id === id)?.username ||
                    `Técnico #${id}`}
                  {id === task?.technicianId ? ' (Actual)' : ' (Asignado al ticket)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Visual interactive schedule selector with manual fallback */}
        <VisualScheduleSelector
          selectedStart={startDate}
          durationMinutes={durationMinutes}
          onSlotSelect={(newStart, newDuration) => {
            setStart(localDateTime(newStart))
            setEnd(localDateTime(new Date(newStart.getTime() + newDuration * 60_000)))
            setError('')
            setConflict(null)
          }}
          busyPeriods={availability.data?.busy}
          suggestedStart={availability.data?.suggestedStart}
          isAvailable={availability.data?.available ?? true}
          isFetchingAvailability={availability.isFetching}
          disabled={busy || effectiveTechId <= 0}
          manualInputSection={
            <div className="grid gap-2">
              <PlanningDateTimeField id="task-replan-start" label="Nuevo inicio" value={start} onChange={setStart} disabled={busy} />
              <PlanningDateTimeField id="task-replan-end" label="Nuevo fin" value={end} onChange={setEnd} disabled={busy} />
            </div>
          }
        />

        {/* Comentario o motivo de replanificación */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="task-replan-content">Trabajo por realizar</Label>
            <span className="text-[11px] text-muted-foreground">Opcional</span>
          </div>
          <Textarea
            id="task-replan-content"
            value={content}
            disabled={busy}
            maxLength={4000}
            placeholder="Opcional: detalles del trabajo a realizar o motivo de reprogramación..."
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[70px]"
          />
        </div>

        {isSame && (
          <p className="text-xs text-muted-foreground text-center">
            Modifica la fecha, duración, técnico o comentario para guardar los cambios.
          </p>
        )}

        {error && (
          <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-red-700 dark:text-red-400">
            <p className="font-medium">{error}</p>
            {conflict && conflict.conflicts.length > 0 && (
              <ul className="space-y-0.5 text-foreground/80">
                {conflict.conflicts.map((item) => (
                  <li key={`${item.ticketId}-${item.taskId}`}>
                    Ticket #{item.ticketId} · tarea #{item.taskId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" className="min-h-11 w-full sm:w-auto" disabled={busy} onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={busy || isSame || availability.isFetching || availability.isError || !availability.data?.available}>
            {mutation.isPending ? 'Reprogramando...' : 'Guardar nueva programación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
