import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReopenTicketMutation } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
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
  const { register, handleSubmit, reset, clearErrors, watch, formState: { errors } } = useForm<{ reason: string }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { reason: '' },
  })
  const reason = watch('reason')
  const reopenTicket = useReopenTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  const pending = reopenTicket.isPending
  const hasError = Boolean(errors.reason)

  const submit = () => {
    if (pending) return
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
          reset()
          onOpenChange(false)
        },
        onError: (err) => {
          pushToast({
            title: getApiErrorTitle(err, 'No se pudo reabrir el ticket'),
            description: getApiErrorMessage(err),
            variant: 'destructive',
          })
        },
      },
    )
  }

  return (
    <Dialog
      className="rounded-2xl bg-card"
      open={open}
      onClose={() => {
        if (!pending) {
          clearErrors()
          onOpenChange(false)
        }
      }}
      title={`Reabrir ticket #${ticketId}`}
      description="Indica el motivo de la reapertura (opcional, máximo 500 caracteres). Se añadirá como nota privada y el ticket volverá a estado Asignado."
    >
      <form onSubmit={handleSubmit(submit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="reopen-reason">Motivo (opcional)</Label>
          <Textarea
            id="reopen-reason"
            {...register('reason', { maxLength: { value: 500, message: 'El motivo no puede exceder 500 caracteres.' } })}
            placeholder="Motivo de la reapertura..."
            className={cn('min-h-[100px] rounded-xl bg-background/50', hasError && 'border-destructive focus-visible:ring-destructive')}
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
            type="button"
            onClick={() => {
              clearErrors()
              onOpenChange(false)
            }}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Reabriendo...' : 'Reabrir'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
