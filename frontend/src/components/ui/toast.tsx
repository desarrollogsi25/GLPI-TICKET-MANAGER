import { cn } from '@/lib/utils'
import { useToastStore, type ToastVariant } from '@/store/toastStore'

const variantClasses: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  success: 'border-success/40 bg-success/10 text-foreground',
  destructive: 'border-destructive/40 bg-destructive/10 text-foreground',
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="pointer-events-none fixed top-4 inset-x-4 z-[100] flex flex-col gap-2 md:top-auto md:bottom-4 md:right-4 md:left-auto md:w-full md:max-w-sm pt-[env(safe-area-inset-top)] md:pt-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            'pointer-events-auto rounded-lg border p-4 shadow-lg',
            variantClasses[toast.variant],
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
