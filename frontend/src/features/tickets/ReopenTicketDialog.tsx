import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useReopenTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

export function ReopenTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const reopenTicket = useReopenTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  const pending = reopenTicket.isPending
  const hasError = touched && reason.length > 500
  const disabled = reason.length > 500 || pending

  const submit = () => {
    if (disabled) {
      setTouched(true)
      return
    }
    const trimmed = reason.trim()
    reopenTicket.mutate(
      { ticketId, reason: trimmed.length > 0 ? trimmed : undefined },
      {
        onSuccess: () => {
          pushToast({
            title: 'Ticket reabierto correctamente',
            description: `El ticket #${ticketId} ha vuelto a estado Asignado.`,
            variant: 'success',
          })
          setReason('')
          setTouched(false)
          onOpenChange(false)
        },
        onError: (err) => {
          pushToast({
            title: 'No se pudo reabrir el ticket',
            description: getApiErrorMessage(err),
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) {
          setTouched(false)
          onOpenChange(false)
        }
      }}
      title={`Reabrir ticket #${ticketId}`}
      description="Indica el motivo de la reapertura (opcional, máximo 500 caracteres). Se añadirá como nota privada y el ticket volverá a estado Asignado."
    >
      <div className="space-y-1.5">
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Motivo de la reapertura..."
          className={cn('min-h-[100px]', hasError && 'border-destructive focus-visible:ring-destructive')}
          maxLength={500}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'reason-error' : undefined}
        />
        <div className="flex justify-between items-center text-xs">
          {hasError ? (
            <p id="reason-error" role="alert" className="text-destructive font-medium">
              El motivo no puede exceder 500 caracteres.
            </p>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">{reason.length}/500</span>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setTouched(false)
            onOpenChange(false)
          }}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button onClick={submit} disabled={disabled}>
          {pending ? 'Reabriendo...' : 'Reabrir'}
        </Button>
      </div>
    </Dialog>
  )
}
