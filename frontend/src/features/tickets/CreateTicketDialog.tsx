import { useCallback, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useServicesQuery } from '@/hooks/useServices'
import { useCreateTicketMutation } from '@/hooks/useTickets'
import { getApiErrorMessage, getApiErrorTitle } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

export function CreateTicketDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<number>(3)
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [touched, setTouched] = useState(false)

  const servicesQuery = useServicesQuery()
  const createTicket = useCreateTicketMutation()
  const pushToast = useToastStore((state) => state.push)

  const pending = createTicket.isPending
  const trimmedTitle = title.trim()
  const hasTitleError = touched && trimmedTitle.length === 0
  const disabled = trimmedTitle.length === 0 || pending

  const handleClose = useCallback(() => {
    if (!pending) {
      setTitle('')
      setDescription('')
      setUrgency(3)
      setCategoryId('')
      setTouched(false)
      onOpenChange(false)
    }
  }, [pending, onOpenChange])

  const submit = async () => {
    if (disabled) {
      setTouched(true)
      return
    }

    try {
      const res = await createTicket.mutateAsync({
        title: trimmedTitle,
        description: description.trim(),
        urgency,
        categoryId: categoryId === '' ? null : Number(categoryId),
      })

      pushToast({
        title: 'Ticket creado correctamente',
        description: `Se creó el ticket #${res.ticketId}.`,
        variant: 'success',
      })
      setTitle('')
      setDescription('')
      setUrgency(3)
      setCategoryId('')
      setTouched(false)
      onOpenChange(false)
    } catch (err) {
      pushToast({
        title: getApiErrorTitle(err, 'No se pudo crear el ticket'),
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Crear nuevo ticket"
      description="Completá los datos del ticket. Se enrutará automáticamente según la categoría seleccionada."
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="create-ticket-title">Título</Label>
          <Input
            id="create-ticket-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Ej. Error al sincronizar reporte..."
            aria-invalid={hasTitleError}
            className={cn(hasTitleError && 'border-destructive focus-visible:ring-destructive')}
            data-testid="create-ticket-title-input"
          />
          {hasTitleError ? (
            <p role="alert" className="text-xs text-destructive">
              El título es obligatorio.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-ticket-category">Categoría / Servicio</Label>
          <Select
            id="create-ticket-category"
            value={categoryId === '' ? '' : String(categoryId)}
            onChange={(e) => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
            data-testid="create-ticket-category-select"
          >
            <option value="">Asignación automática a mi grupo</option>
            {(servicesQuery.data ?? []).map((service) => (
              <option key={service.id} value={service.id}>
                {service.completeName || service.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-ticket-urgency">Urgencia</Label>
          <Select
            id="create-ticket-urgency"
            value={String(urgency)}
            onChange={(e) => setUrgency(Number(e.target.value))}
            data-testid="create-ticket-urgency-select"
          >
            <option value="1">1 - Muy baja</option>
            <option value="2">2 - Baja</option>
            <option value="3">3 - Media</option>
            <option value="4">4 - Alta</option>
            <option value="5">5 - Muy alta</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="create-ticket-description">Descripción</Label>
          <Textarea
            id="create-ticket-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí el detalle del requerimiento o incidente..."
            className="min-h-[100px]"
            data-testid="create-ticket-description-textarea"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose} disabled={pending}>
          Cancelar
        </Button>
        <Button
          onClick={() => void submit()}
          disabled={disabled}
          data-testid="create-ticket-submit-btn"
        >
          {pending ? 'Creando...' : 'Crear ticket'}
        </Button>
      </div>
    </Dialog>
  )
}
