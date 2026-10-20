import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSolutionMutation, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
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
  const createSolution = useCreateSolutionMutation()
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)

  const trimmed = content.trim()
  const pending = createSolution.isPending || updateStatus.isPending
  // Short solutions are valid ("OK", "Listo"); only an empty one blocks the ticket.
  const hasError = touched && trimmed.length === 0
  const disabled = trimmed.length === 0 || pending

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
                pushToast({
                  title: 'Ticket resuelto correctamente',
                  description: `El ticket #${ticketId} ha sido marcado como resuelto.`,
                  variant: 'success',
                })
                setContent('')
                setTouched(false)
                onOpenChange(false)
              },
              onError: (err) => {
                pushToast({
                  title: 'No se pudo resolver',
                  description: getApiErrorMessage(err),
                  variant: 'destructive',
                })
              },
            },
          )
        },
        onError: (err) => {
          pushToast({
            title: 'No se pudo guardar la solución',
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
          onClick={() => {
            setTouched(false)
            onOpenChange(false)
          }}
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