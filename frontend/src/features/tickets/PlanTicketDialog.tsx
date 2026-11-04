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
import { localDateTime, parseUnambiguousLocal } from './planningDates'

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
    if (!open) {
      setContent('')
      setError('')
      return
    }
    const initial = new Date(Math.ceil((Date.now() + 15 * 60_000) / 300_000) * 300_000)
    setStart(localDateTime(initial))
    setEnd(localDateTime(new Date(initial.getTime() + 60 * 60_000)))
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
    setError('')
    try {
      const result = await planning.mutateAsync({ ticketId, payload: {
        requestId: requestId.current ?? uuidv4(),
        content: content.trim() || 'Intervención planificada',
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
      } })
      pushToast({ title: 'Ticket planificado', description: `Tarea GLPI #${result.taskId} creada y estado En proceso (planificado) confirmado.`, variant: 'success' })
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
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="plan-start">Fecha y hora de inicio</Label>
            <Input id="plan-start" type="datetime-local" required value={start} onChange={(event) => setStart(event.target.value)} data-testid="plan-start" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="plan-end">Fecha y hora de fin</Label>
            <Input id="plan-end" type="datetime-local" required value={end} onChange={(event) => setEnd(event.target.value)} data-testid="plan-end" />
          </div>
        </div>

        {/* Atajos de duración estimada */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Duración estimada:</span>
          {[
            { label: '30m', minutes: 30 },
            { label: '1h', minutes: 60 },
            { label: '2h', minutes: 120 },
            { label: '4h', minutes: 240 },
            { label: '1 día', minutes: 1440 },
          ].map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => {
                const s = parseUnambiguousLocal(start) ?? new Date()
                setEnd(localDateTime(new Date(s.getTime() + d.minutes * 60_000)))
              }}
              className="text-[11px] px-2 py-0.5 rounded-full border border-border/80 bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              +{d.label}
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

        {error && <p role="alert" className="text-xs font-medium text-destructive">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={planning.isPending} onClick={close}>Cancelar</Button>
          <Button type="submit" disabled={planning.isPending} data-testid="plan-confirm-btn">
            {planning.isPending ? 'Planificando...' : 'Confirmar planificación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
