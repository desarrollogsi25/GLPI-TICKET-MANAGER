import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

/**
 * Accessible AlertDialog / ConfirmAction pattern for irreversible or high-impact mutations.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!loading) onClose()
      }}
      title={title}
      description={description}
    >
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button variant="outline" disabled={loading} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={variant} loading={loading} onClick={onConfirm}>
          {loading ? 'Procesando...' : confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
