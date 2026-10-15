import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { useIsMobile } from '@/hooks/useIsMobile'
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
  const isMobile = useIsMobile(768)
  const prefersReduced = useReducedMotion()

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed top-4 inset-x-4 z-[100] flex flex-col gap-2 md:top-auto md:bottom-4 md:right-4 md:left-auto md:w-full md:max-w-sm pt-[env(safe-area-inset-top)] md:pt-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="status"
            initial={
              prefersReduced
                ? false
                : isMobile
                  ? { opacity: 0, y: -20, scale: 0.95 }
                  : { opacity: 0, y: 20, x: 20, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={
              prefersReduced
                ? undefined
                : isMobile
                  ? { opacity: 0, y: -20, scale: 0.95 }
                  : { opacity: 0, x: 40, scale: 0.95 }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 400, damping: 28 }
            }
            drag={isMobile ? 'y' : 'x'}
            dragConstraints={isMobile ? { top: 0, bottom: 0 } : { left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_e, info) => {
              if (isMobile) {
                if (info.offset.y < -30 || info.velocity.y < -200) {
                  dismiss(toast.id)
                }
              } else {
                if (info.offset.x > 30 || info.velocity.x > 200) {
                  dismiss(toast.id)
                }
              }
            }}
            className={cn(
              'pointer-events-auto rounded-lg border p-4 shadow-lg select-none cursor-grab active:cursor-grabbing',
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
                className="text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                aria-label="Cerrar notificación"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
