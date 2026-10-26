import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useResolveTicketMutation } from '@/hooks/useTickets'
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const resolveTicket = useResolveTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  /**
   * Synchronous in-flight guard. `resolveTicket.isPending` only becomes true after
   * React re-renders, so a fast double click could fire two requests before the
   * button is actually disabled. The second request would be rejected by the API
   * with 409 and the technician would see a spurious error toast. This ref flips
   * the moment the handler starts, so the second click is dropped immediately.
   */
  const submittingRef = useRef(false)

  const trimmed = content.trim()
  const pending = resolveTicket.isPending || isSubmitting
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

  /**
   * Resolves the ticket with a single call (BUG-031 / H-31).
   *
   * `POST /tickets/{id}/resolve` writes the solution, moves the ticket to its
   * resolved state and emits one realtime event. The previous two-call sequence
   * ("POST /solutions" then "PATCH /status") made the same technician action fail
   * with 400/422, because GLPI already solves the ticket when the solution is
   * written and the solution-presence query applied a minimum length the API never
   * enforced. One call removes the inconsistency by construction.
   */
  const submit = async () => {
    if (submittingRef.current || trimmed.length === 0) {
      setTouched(true)
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)

    try {
      await resolveTicket.mutateAsync({ ticketId, content: trimmed })
    } catch (err) {
      // The ticket may still have been solved server-side (e.g. the write succeeded
      // but the response was lost), so always refresh before reporting the failure.
      void queryClient.invalidateQueries({ queryKey: ['tickets'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      pushToast({
        title: getApiErrorTitle(err, 'No se pudo resolver el ticket'),
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
      return
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }

    closeDialog()
    void queryClient.invalidateQueries({ queryKey: ['tickets'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    pushToast({
      title: 'Ticket resuelto correctamente',
      description: `El ticket #${ticketId} pasó a Resuelto`,
      variant: 'success',
    })
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
          maxLength={2000}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Describí la solución aplicada..."
          className={cn('min-h-[120px]', hasError && 'border-destructive focus-visible:ring-destructive')}
          aria-invalid={hasError}
          aria-describedby={hasError ? 'solution-error' : undefined}
        />
        <div className="flex items-center justify-between text-xs">
          {hasError ? (
            <p id="solution-error" role="alert" className="text-destructive">
              La solución no puede estar vacía.
            </p>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground ml-auto">
            {content.length} / 2000
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={closeDialog}
          disabled={pending}
        >
          Cancelar
        </Button>
        <Button onClick={() => void submit()} disabled={disabled}>
          {pending ? 'Guardando...' : 'Resolver'}
        </Button>
      </div>
    </Dialog>
  )
}
