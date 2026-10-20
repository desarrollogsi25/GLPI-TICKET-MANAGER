import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCreateTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useToastStore } from '@/store/toastStore'

const createTicketSchema = z.object({
  title: z
    .string()
    .min(1, 'El título es obligatorio')
    .min(5, 'El título debe tener al menos 5 caracteres'),
  description: z
    .string()
    .min(1, 'La descripción es obligatoria')
    .min(10, 'La descripción debe tener al menos 10 caracteres'),
  urgency: z.coerce.number().int().min(1).max(5).default(3),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>

interface CreateTicketDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const pushToast = useToastStore((state) => state.push)
  const createTicketMutation = useCreateTicketMutation()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      urgency: 3,
    },
  })

  const isPending = createTicketMutation.isPending

  const handleClose = () => {
    if (!isPending) {
      reset()
      onClose()
    }
  }

  const onSubmit = (values: CreateTicketFormValues) => {
    createTicketMutation.mutate(
      {
        title: values.title.trim(),
        description: values.description.trim(),
        urgency: values.urgency,
      },
      {
        onSuccess: () => {
          pushToast({
            title: 'Ticket creado correctamente',
            variant: 'success',
          })
          reset()
          onClose()
        },
        onError: (err) => {
          pushToast({
            title: 'No se pudo crear el ticket',
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
      onClose={handleClose}
      title="Crear nuevo ticket"
      description="Ingresa los datos para registrar tu solicitud."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ticket-title">Título</Label>
          <Input
            id="ticket-title"
            placeholder="Ej: Problema con el acceso a correo"
            {...register('title')}
            aria-invalid={errors.title ? 'true' : 'false'}
          />
          {errors.title && (
            <p className="text-xs text-destructive font-medium">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-description">Descripción</Label>
          <Textarea
            id="ticket-description"
            rows={4}
            placeholder="Describe detalladamente el problema o requerimiento..."
            {...register('description')}
            aria-invalid={errors.description ? 'true' : 'false'}
          />
          {errors.description && (
            <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ticket-urgency">Urgencia</Label>
          <Select
            id="ticket-urgency"
            {...register('urgency')}
            aria-invalid={errors.urgency ? 'true' : 'false'}
          >
            <option value={2}>Baja</option>
            <option value={3}>Media</option>
            <option value={4}>Alta</option>
            <option value={5}>Muy Alta</option>
          </Select>
          {errors.urgency && (
            <p className="text-xs text-destructive font-medium">{errors.urgency.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
