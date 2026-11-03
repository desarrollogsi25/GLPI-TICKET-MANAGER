import { useEffect, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'

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
    if (duration < 60_000 || duration > 30 * 86_400_000 || content.trim().length < 1 || content.trim().length > 4000) {
      setError('La descripción es obligatoria (máximo 4000 caracteres) y la duración debe ser de 1 minuto a 30 días.')
      return
    }
    setError('')
    try {
      await mutation.mutateAsync({ ticketId, taskId: task.id, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: content.trim(),
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

  return (
    <Dialog open={task !== null} onClose={() => { if (!mutation.isPending) onClose() }}
      title={`Reprogramar tarea #${task?.id ?? ''}`}
      description="Se actualizará la tarea real en GLPI y se confirmarán las fechas mediante una nueva lectura.">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="task-replan-content">Trabajo por realizar</Label>
          <Textarea id="task-replan-content" value={content} required maxLength={4000}
            onChange={(event) => setContent(event.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="task-replan-start">Inicio</Label>
            <Input id="task-replan-start" type="datetime-local" required value={start}
              onChange={(event) => setStart(event.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-replan-end">Fin</Label>
            <Input id="task-replan-end" type="datetime-local" required value={end}
              onChange={(event) => setEnd(event.target.value)} />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={mutation.isPending} onClick={onClose}>Volver</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Reprogramando...' : 'Guardar nueva programación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
