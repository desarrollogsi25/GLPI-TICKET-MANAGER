import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useCreateSolutionMutation, useUpdateTicketStatusMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
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
  const createSolution = useCreateSolutionMutation()
  const updateStatus = useUpdateTicketStatusMutation()
  const pushToast = useToastStore((state) => state.push)

  const trimmed = content.trim()
  const pending = createSolution.isPending || updateStatus.isPending
  const disabled = trimmed.length < 10 || pending

  const submit = () => {
    if (disabled) return
    createSolution.mutate(
      { ticketId, content: trimmed },
      {
        onSuccess: () => {
          updateStatus.mutate(
            { ticketId, status: 5 },
            {
              onSuccess: () => {
                pushToast({ title: 'Ticket resuelto', variant: 'success' })
                setContent('')
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
            title: 'No se pudo guardar la solucion',
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
      title={`Resolver ticket #${ticketId}`}
      description="Escribi la solucion (minimo 10 caracteres). Sin solucion el ticket no puede marcarse como resuelto."
    >
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Describi la solucion aplicada..."
        className="min-h-[120px]"
      />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={disabled}>
          {pending ? 'Guardando...' : 'Resolver'}
        </Button>
      </div>
    </Dialog>
  )
}