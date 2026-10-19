import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useReopenTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
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
  const reopenTicket = useReopenTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  const pending = reopenTicket.isPending
  const disabled = reason.length > 500 || pending

  const submit = () => {
    if (disabled) return
    const trimmed = reason.trim()
    reopenTicket.mutate(
      { ticketId, reason: trimmed.length > 0 ? trimmed : undefined },
      {
        onSuccess: () => {
          pushToast({ title: 'Ticket reabierto', variant: 'success' })
          setReason('')
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
        if (!pending) onOpenChange(false)
      }}
      title={`Reabrir ticket #${ticketId}`}
      description="Indica el motivo de la reapertura (opcional, máximo 500 caracteres). Se añadirá como nota privada y el ticket volverá a estado Asignado."
    >
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo de la reapertura..."
        className="min-h-[100px]"
        maxLength={500}
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={disabled}>
          {pending ? 'Reabriendo...' : 'Reabrir'}
        </Button>
      </div>
    </Dialog>
  )
}
