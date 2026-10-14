import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useChannelsQuery, useCreateTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

import { TICKET_PRIORITIES, TICKET_TYPES } from './labels'

const createTicketSchema = z.object({
  title: z.string().trim().min(1, 'El titulo es obligatorio').max(255, 'Maximo 255 caracteres'),
  content: z.string().max(5000, 'Maximo 5000 caracteres').optional(),
  type: z.enum(['1', '2']),
  urgency: z.enum(['1', '2', '3', '4', '5', '6']),
  impact: z.enum(['1', '2', '3', '4', '5', '6']),
  channel: z.string().optional(),
  requesterType: z.enum(['internal', 'external']),
  selfAssign: z.boolean(),
  externalName: z.string().optional(),
  externalPhone: z.string().optional(),
  externalCompany: z.string().optional(),
  externalEmail: z.string().optional(),
})

type CreateTicketFormValues = z.infer<typeof createTicketSchema>

interface CreateTicketDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const requesterId = useAuthStore((state) => state.user?.userId ?? null)
  const channels = useChannelsQuery()
  const createTicket = useCreateTicketMutation()
  const pushToast = useToastStore((state) => state.push)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      type: '1',
      urgency: '3',
      impact: '3',
      selfAssign: true,
      requesterType: 'internal',
      channel: undefined,
    },
  })

  const requesterType = watch('requesterType')

  const close = () => {
    reset()
    onClose()
  }

  const onSubmit = handleSubmit((values) => {
    const isExternal = values.requesterType === 'external'
    const name = values.externalName?.trim()
    const phone = values.externalPhone?.trim()
    const company = values.externalCompany?.trim()
    const description = values.content?.trim() ?? ''

    let content: string | undefined
    if (isExternal && (name || phone || company || description)) {
      const header = `Llamante: ${name ?? ''} · Tel: ${phone ?? ''} · Empresa: ${company ?? ''}`
      content = description ? `${header}\n\n${description}` : header
    } else if (description) {
      content = description
    }

    const payload = {
      title: values.title.trim(),
      content,
      type: Number(values.type),
      urgency: Number(values.urgency),
      impact: Number(values.impact),
      assigneeId: values.selfAssign ? (requesterId ?? undefined) : undefined,
      requesterId: isExternal ? undefined : (requesterId ?? undefined),
      requestTypeId: values.channel ? Number(values.channel) : undefined,
      externalRequesterEmail: isExternal ? (values.externalEmail?.trim() || undefined) : undefined,
      externalRequesterName: isExternal ? (name || undefined) : undefined,
      externalRequesterPhone: isExternal ? (phone || undefined) : undefined,
      externalRequesterCompany: isExternal ? (company || undefined) : undefined,
    }

    createTicket.mutate(payload, {
      onSuccess: (created) => {
        pushToast({
          title: `Ticket #${created.id} creado`,
          description: 'El ticket se registro en GLPI.',
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
    })
  })

  return (
    <Dialog open={open} onClose={close} title="Nuevo ticket" description="Se creara a traves del API de GLPI.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <Label htmlFor="title">Titulo</Label>
          <Input id="title" placeholder="Resumen del problema" {...register('title')} />
          {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Tipo de solicitante</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="internal" {...register('requesterType')} />
              Interno
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="external" {...register('requesterType')} />
              Externo
            </label>
          </div>
        </div>

        {requesterType === 'external' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="externalName">Nombre del llamante</Label>
              <Input id="externalName" placeholder="Juan Perez" {...register('externalName')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="externalPhone">Telefono</Label>
              <Input id="externalPhone" placeholder="+34 600 111 222" {...register('externalPhone')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="externalEmail">Email</Label>
              <Input id="externalEmail" placeholder="juan@acme.com" type="email" {...register('externalEmail')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="externalCompany">Empresa (opcional)</Label>
              <Input id="externalCompany" placeholder="ACME" {...register('externalCompany')} />
            </div>
          </div>
        ) : null}

        <div className="space-y-1">
          <Label htmlFor="channel">Canal</Label>
          <Select id="channel" {...register('channel')} defaultValue="">
            <option value="">(default GLPI)</option>
            {(channels.data ?? []).map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="content">Descripcion</Label>
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
            {createTicket.isPending ? 'Creando...' : 'Crear ticket'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}