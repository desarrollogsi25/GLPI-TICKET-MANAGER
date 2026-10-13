import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

import { TICKET_PRIORITIES, TICKET_TYPES } from './labels'

const createTicketSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(255, 'Máximo 255 caracteres'),
  content: z.string().max(5000, 'Máximo 5000 caracteres').optional(),
  type: z.enum(['1', '2']),
  urgency: z.enum(['1', '2', '3', '4', '5', '6']),
  impact: z.enum(['1', '2', '3', '4', '5', '6']),
  // When checked the ticket is assigned to the authenticated user; when unchecked
  // `assigneeId` is omitted and GLPI leaves the ticket in status "New".
  selfAssign: z.boolean(),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>

interface CreateTicketDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const requesterId = useAuthStore((state) => state.user?.userId ?? null)
  const createTicket = useCreateTicketMutation()
  const pushToast = useToastStore((state) => state.push)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { type: '1', urgency: '3', impact: '3', selfAssign: true },
  })

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((values) => {
    createTicket.mutate(
      {
        title: values.title.trim(),
        content: values.content?.trim() ? values.content.trim() : undefined,
        type: Number(values.type),
        urgency: Number(values.urgency),
        impact: Number(values.impact),
        assigneeId: values.selfAssign ? (requesterId ?? undefined) : undefined,
        requesterId: requesterId ?? undefined,
      },
      {
        onSuccess: (created) => {
          pushToast({
            title: `Ticket #${created.id} creado`,
            description: 'El ticket se registró en GLPI.',
            variant: 'success',
          })
          close()
          navigate(`/tickets/${created.id}`)
        },
        onError: (error) =>
          pushToast({
            title: 'No se pudo crear el ticket',
            description: getApiErrorMessage(error),
            variant: 'destructive',
          }),
      },
    )
  })

  return (
    <Dialog open={open} onClose={close} title="Nuevo ticket" description="Se creará a través del API de GLPI.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="title">Título</Label>
          <Input id="title" placeholder="Resumen del problema" {...register('title')} />
          {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-1">
          <Label htmlFor="content">Descripción</Label>
          <Textarea id="content" rows={4} placeholder="Detalle del ticket" {...register('content')} />
          {errors.content ? <p className="text-xs text-destructive">{errors.content.message}</p> : null}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label htmlFor="type">Tipo</Label>
            <Select id="type" {...register('type')}>
              {TICKET_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="urgency">Urgencia</Label>
            <Select id="urgency" {...register('urgency')}>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="impact">Impacto</Label>
            <Select id="impact" {...register('impact')}>
              {TICKET_PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="selfAssign"
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            {...register('selfAssign')}
          />
          <Label htmlFor="selfAssign" className="cursor-pointer font-normal">
            Asignarme este ticket
          </Label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={close} disabled={createTicket.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createTicket.isPending}>
            {createTicket.isPending ? 'Creando…' : 'Crear ticket'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
