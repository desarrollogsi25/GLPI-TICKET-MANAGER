import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastVariant } from '@/store/toastStore'

const variantClasses: Record<ToastVariant, string> = {
  default: 'border-border bg-card text-card-foreground shadow-lg',
  success:
    'border-emerald-500/40 bg-emerald-500/10 text-foreground dark:bg-emerald-950/40 dark:border-emerald-500/40 shadow-lg',
  destructive:
    'border-destructive/40 bg-destructive/10 text-foreground dark:bg-red-950/40 dark:border-red-500/40 shadow-lg',
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
            data-testid="toast-item"
            role={toast.variant === 'destructive' ? 'alert' : 'status'}
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
              'pointer-events-auto rounded-lg border p-4 shadow-lg select-none cursor-grab active:cursor-grabbing backdrop-blur-sm',
              variantClasses[toast.variant],
            )}
          >
            <div className="flex items-start gap-3">
              {/* Icon per variant */}
              <div className="mt-0.5 shrink-0">
                {toast.variant === 'success' && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
                {toast.variant === 'destructive' && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-destructive/20 text-destructive dark:text-red-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                )}
                {toast.variant === 'default' && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{toast.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer p-1 rounded hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
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
