import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSolutionMutation, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { getApiErrorTitle, getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

export function ResolveTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: number
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [touched, setTouched] = useState(false)
  const queryClient = useQueryClient()
  const createSolution = useCreateSolutionMutation()
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)

  const trimmed = content.trim()
  const pending = createSolution.isPending || updateStatus.isPending
  // Short solutions are valid ("OK", "Listo"); only an empty one blocks the ticket.
  const hasError = touched && trimmed.length === 0
  const disabled = trimmed.length === 0 || pending

  /**
   * Closes the dialog unconditionally (never gated on `pending`). Used after a
   * successful mutation so the modal always dismisses on mobile, where the ticket
   * may have moved to the auto-closed "Resuelto" state underneath.
   */
  const closeDialog = () => {
    setContent('')
    setTouched(false)
    onOpenChange(false)
  }

  const submit = () => {
    if (disabled) {
      setTouched(true)
      return
    }
    createSolution.mutate(
      { ticketId, content: trimmed },
      {
        onSuccess: () => {
          updateStatus.mutate(
            { ticketId, status: 5 },
            {
              onSuccess: () => {
                closeDialog()
                void queryClient.invalidateQueries({ queryKey: ['tickets'] })
                void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
                try {
                  pushToast({
                    title: 'Ticket resuelto correctamente',
                    description: `El ticket #${ticketId} ha sido marcado como resuelto.`,
                    variant: 'success',
                  })
                } catch {
                  // toast fail-safe
                }
              },
              onError: (err) => {
                pushToast({
                  title: getApiErrorTitle(err, 'No se pudo resolver el ticket'),
                  description: getApiErrorMessage(err),
                  variant: 'destructive',
                })
              },
            },
          )
        },
        onError: (err) => {
          pushToast({
            title: getApiErrorTitle(err, 'No se pudo guardar la solución'),
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
        // Backdrop / Escape: keep the dialog open while the resolve is in flight so the
        // user cannot dismiss it mid-flight and lose the operation's result.
        if (!pending) {
          closeDialog()
        }
      }}
      title={`Resolver ticket #${ticketId}`}
      description="Escribí la solución. Puede ser breve (por ejemplo «OK»), pero no puede quedar vacía: sin solución el ticket no puede marcarse como resuelto."
    >
      <div className="space-y-1.5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Describí la solución aplicada..."
          className={cn('min-h-[120px]', hasError && 'border-destructive focus-visible:ring-destructive')}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'solution-error' : undefined}
        />
        {hasError ? (
          <p id="solution-error" role="alert" className="text-xs text-destructive">
            La solución no puede estar vacía.
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={closeDialog}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button onClick={submit} disabled={disabled}>
          {pending ? 'Guardando...' : 'Resolver'}
        </Button>
      </div>
    </Dialog>
  )
}
