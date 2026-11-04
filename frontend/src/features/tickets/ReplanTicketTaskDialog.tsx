import { useEffect, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Clock, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReplanTicketTaskMutation } from '@/hooks/useTickets'
import type { TicketTask } from '@/lib/api/tickets'
import { getApiErrorMessage, getApiErrorTitle } from '@/lib/api/errors'
import { toPlainText } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'
import { localDateTime, parseUnambiguousLocal } from './planningDates'

export function ReplanTicketTaskDialog({ ticketId, task, onClose }: {
  ticketId: number
  task: TicketTask | null
  onClose: () => void
}) {
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const requestId = useRef<string | null>(null)
  const mutation = useReplanTicketTaskMutation()
  const pushToast = useToastStore((state) => state.push)

  useEffect(() => {
    if (!task) return
    setContent(toPlainText(task.content))
    setStart(task.startAt ? localDateTime(new Date(task.startAt)) : '')
    setEnd(task.endAt ? localDateTime(new Date(task.endAt)) : '')
    setError('')
    requestId.current = uuidv4()
  }, [task])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!task) return
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
    setError('')
    try {
      await mutation.mutateAsync({ ticketId, taskId: task.id, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: content.trim() || 'Intervención planificada',
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      } })
      pushToast({ title: `Tarea #${task.id} reprogramada en GLPI`, variant: 'success' })
      onClose()
    } catch (mutationError) {
      pushToast({ title: getApiErrorTitle(mutationError, 'No se pudo reprogramar'),
        description: getApiErrorMessage(mutationError), variant: 'destructive' })
    }
  }

  const prevStart = task?.startAt ? new Date(task.startAt).toLocaleString() : 'No definida'
  const prevEnd = task?.endAt ? new Date(task.endAt).toLocaleString() : 'No definida'

  return (
    <Dialog open={task !== null} onClose={() => { if (!mutation.isPending) onClose() }}
      title={`Reprogramar tarea #${task?.id ?? ''}`}
      description="Actualiza la planificación de la intervención técnica en GLPI conservando auditoría e idempotencia.">
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
            <span>{task?.technicianId ? `Técnico #${task.technicianId}` : '—'}</span>
          </div>
        </div>

        {/* Nuevo Horario */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="task-replan-start">Nuevo inicio</Label>
            <Input id="task-replan-start" type="datetime-local" required value={start}
              onChange={(event) => setStart(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-replan-end">Nuevo fin</Label>
            <Input id="task-replan-end" type="datetime-local" required value={end}
              onChange={(event) => setEnd(event.target.value)} />
          </div>
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
            <Label htmlFor="task-replan-content">Motivo o notas de reprogramación</Label>
            <span className="text-[11px] text-muted-foreground">Opcional</span>
          </div>
          <Textarea
            id="task-replan-content"
            value={content}
            maxLength={4000}
            placeholder="Opcional: motivo del cambio de horario o nuevos requerimientos..."
            onChange={(event) => setContent(event.target.value)}
            className="min-h-[70px]"
          />
        </div>

        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reprogramando...' : 'Confirmar reprogramación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
