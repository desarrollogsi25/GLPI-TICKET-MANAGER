import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { usePutPendingMutation } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

/**
 * Motivos de pendiente. Mientras el endpoint de motivos no esté disponible en el
 * backend, se usan valores mock. Cuando `GET /api/pending-reasons` exista, reemplazar
 * por la carga real (React Query).
 */
const MOCK_PENDING_REASONS = [
  { id: 1, label: 'Esperando respuesta del usuario' },
  { id: 2, label: 'Esperando pieza / repuesto' },
  { id: 3, label: 'Escalado a otro equipo' },
  { id: 4, label: 'Falta información técnica' },
  { id: 5, label: 'Otros' },
]

export function PendingTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [reasonId, setReasonId] = useState<number | ''>('')
  const [comment, setComment] = useState('')
  const [touched, setTouched] = useState(false)
  const putPending = usePutPendingMutation()
  const pushToast = useToastStore((state) => state.push)

  const pending = putPending.isPending
  const trimmed = comment.trim()
  const hasReasonError = touched && reasonId === ''
  const hasCommentError = touched && trimmed.length === 0
  const disabled = reasonId === '' || trimmed.length === 0 || pending

  const submit = async () => {
    if (disabled) {
      setTouched(true)
      return
    }
    try {
      await putPending.mutateAsync({ ticketId, reasonId: Number(reasonId), comment: trimmed })
      pushToast({
        title: 'Ticket puesto en pendiente',
        description: `El ticket #${ticketId} quedó en estado Pendiente.`,
        variant: 'success',
      })
      setReasonId('')
      setComment('')
      setTouched(false)
      onOpenChange(false)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 422) {
        pushToast({
          title: 'Comentario obligatorio',
          description: 'El motivo de pendiente requiere un comentario no vacío.',
          variant: 'destructive',
        })
      } else if (status === 409) {
        pushToast({
          title: 'Ticket cerrado',
          description: 'No se puede poner en pendiente un ticket cerrado.',
          variant: 'destructive',
        })
      } else {
        pushToast({
          title: getApiErrorTitle(err, 'No se pudo poner en pendiente'),
          description: getApiErrorMessage(err),
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) {
          setReasonId('')
          setComment('')
          setTouched(false)
          onOpenChange(false)
        }
      }}
      title={`Poner en pendiente ticket #${ticketId}`}
      description="Seleccioná el motivo y agregá un comentario explicativo. El ticket pasará a estado Pendiente."
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="pending-reason">Motivo</Label>
          <Select
            id="pending-reason"
            value={reasonId === '' ? '' : String(reasonId)}
            onChange={(e) => setReasonId(e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => setTouched(true)}
            aria-invalid={hasReasonError}
            data-testid="pending-reason-select"
          >
            <option value="">Seleccioná un motivo…</option>
            {MOCK_PENDING_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
          {hasReasonError ? (
            <p role="alert" className="text-xs text-destructive">
              El motivo es obligatorio.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pending-comment">Comentario</Label>
          <Textarea
            id="pending-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Explicá por qué el ticket queda en pendiente..."
            className={cn('min-h-[100px]', hasCommentError && 'border-destructive focus-visible:ring-destructive')}
            aria-invalid={hasCommentError}
            aria-describedby={hasCommentError ? 'pending-comment-error' : undefined}
            data-testid="pending-comment-textarea"
          />
          {hasCommentError ? (
            <p id="pending-comment-error" role="alert" className="text-xs text-destructive">
              El comentario no puede estar vacío.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setReasonId('')
            setComment('')
            setTouched(false)
            onOpenChange(false)
          }}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button onClick={() => void submit()} disabled={disabled} data-testid="pending-confirm-btn">
          {pending ? 'Guardando...' : 'Confirmar'}
        </Button>
      </div>
    </Dialog>
  )
}
