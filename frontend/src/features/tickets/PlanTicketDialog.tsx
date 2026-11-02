import { useEffect, useRef, useState, type FormEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePlanTicketMutation } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { useToastStore } from '@/store/toastStore'

function localDateTime(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`
}

/** Reject DST gaps/overlaps instead of silently scheduling at an unintended time. */
function parseUnambiguousLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || localDateTime(date) !== value) return null
  const oneHourLater = new Date(date.getTime() + 60 * 60_000)
  if (localDateTime(oneHourLater) === value) return null
  return date
}

export function PlanTicketDialog({ ticketId, open, onOpenChange }: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState('')
  const requestId = useRef<string | null>(null)
  const planning = usePlanTicketMutation()
  const pushToast = useToastStore((state) => state.push)
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

  useEffect(() => {
    if (!open) return
    const initial = new Date(Math.ceil((Date.now() + 15 * 60_000) / 300_000) * 300_000)
    setStart(localDateTime(initial))
    setEnd(localDateTime(new Date(initial.getTime() + 60 * 60_000)))
    setContent('')
    setError('')
    requestId.current = uuidv4()
  }, [open, ticketId])

  const close = () => {
    if (!planning.isPending) onOpenChange(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const startDate = parseUnambiguousLocal(start)
    const endDate = parseUnambiguousLocal(end)
    if (!startDate || !endDate) {
      setError('La fecha/hora no existe o es ambigua por el cambio de horario. Elige otra hora.')
      return
    }
    if (endDate.getTime() <= startDate.getTime() || endDate.getTime() - startDate.getTime() > 30 * 86_400_000) {
      setError('El fin debe ser posterior al inicio (máximo 30 días).')
      return
    }
    if (endDate.getTime() - startDate.getTime() < 60_000 || !content.trim() || content.trim().length > 4000) {
      setError('Describe la tarea (máximo 4000 caracteres) y programa al menos 1 minuto.')
      return
    }
    setError('')
    try {
      const result = await planning.mutateAsync({ ticketId, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: content.trim(),
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      } })
      pushToast({ title: 'Ticket planificado', description: `Tarea GLPI #${result.taskId} creada y estado confirmado.`, variant: 'success' })
      onOpenChange(false)
    } catch (err) {
      pushToast({
        title: getApiErrorTitle(err, 'No se pudo confirmar la planificación'),
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onClose={close} title={`Planificar ticket #${ticketId}`}
      description="Se creará una tarea pendiente y programada en GLPI. El ticket pasará a En proceso (planificado) cuando GLPI lo confirme.">
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="plan-content">Trabajo por realizar</Label>
          <Textarea id="plan-content" required maxLength={4000} value={content} onChange={(event) => setContent(event.target.value)}
            placeholder="Explica qué se hará durante la intervención..." data-testid="plan-content" />
        </div>
        <p className="text-xs text-muted-foreground">Zona horaria: {zone}. Las fechas se envían con zona horaria explícita.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="plan-start">Inicio</Label>
            <Input id="plan-start" type="datetime-local" required value={start} onChange={(event) => setStart(event.target.value)} data-testid="plan-start" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plan-end">Fin</Label>
            <Input id="plan-end" type="datetime-local" required value={end} onChange={(event) => setEnd(event.target.value)} data-testid="plan-end" />
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={planning.isPending} onClick={close}>Cancelar</Button>
          <Button type="submit" disabled={planning.isPending} data-testid="plan-confirm-btn">
            {planning.isPending ? 'Planificando...' : 'Crear tarea y planificar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
