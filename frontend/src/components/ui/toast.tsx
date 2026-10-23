import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { MAX_VISIBLE_TOASTS, useToastStore, type ToastVariant } from '@/store/toastStore'

const variantClasses: Record<ToastVariant, string> = {
  default:
    'border-sky-500/40 bg-card/95 text-card-foreground dark:bg-slate-900/95 dark:border-sky-500/40 shadow-xl',
  info: 'border-sky-500/40 bg-sky-50/95 text-foreground dark:bg-sky-950/80 dark:border-sky-500/40 shadow-xl',
  success:
    'border-emerald-500/50 bg-emerald-50/95 text-foreground dark:bg-emerald-950/80 dark:border-emerald-500/50 shadow-xl',
  warning:
    'border-amber-500/50 bg-amber-50/95 text-foreground dark:bg-amber-950/80 dark:border-amber-500/50 shadow-xl',
  destructive:
    'border-destructive/50 bg-red-50/95 text-foreground dark:bg-red-950/85 dark:border-red-500/50 shadow-xl',
  error:
    'border-destructive/50 bg-red-50/95 text-foreground dark:bg-red-950/85 dark:border-red-500/50 shadow-xl',
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)
  const isMobile = useIsMobile(768)
  const prefersReduced = useReducedMotion()

  const visibleToasts = toasts.slice(-MAX_VISIBLE_TOASTS)

  return (
    <div
      data-testid="toast-container"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 inset-x-4 z-50 flex flex-col gap-2 md:bottom-auto md:left-auto md:top-4 md:right-4 md:w-full md:max-w-sm pb-[env(safe-area-inset-bottom)] md:pb-0"
    >
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((toast) => {
          const isError = toast.variant === 'destructive' || toast.variant === 'error'
          const isWarning = toast.variant === 'warning'
          const isSuccess = toast.variant === 'success'

          return (
            <motion.div
              key={toast.id}
              layout
              data-testid="toast-item"
              data-variant={toast.variant}
              role={isError ? 'alert' : 'status'}
              initial={
                prefersReduced
                  ? false
                  : isMobile
                    ? { opacity: 0, y: 24, scale: 0.96 }
                    : { opacity: 0, x: 40, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              exit={
                prefersReduced
                  ? undefined
                  : isMobile
                    ? { opacity: 0, y: 24, scale: 0.96 }
                    : { opacity: 0, x: 40, scale: 0.96 }
              }
              transition={
                prefersReduced
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 420, damping: 30 }
              }
              drag={isMobile ? 'y' : 'x'}
              dragConstraints={isMobile ? { top: 0, bottom: 0 } : { left: 0, right: 0 }}
              dragElastic={0.4}
              onDragEnd={(_e, info) => {
                if (isMobile) {
                  if (info.offset.y > 30 || info.velocity.y > 200) {
                    dismiss(toast.id)
                  }
                } else {
                  if (info.offset.x > 30 || info.velocity.x > 200) {
                    dismiss(toast.id)
                  }
                }
              }}
              className={cn(
                'pointer-events-auto rounded-lg border p-3.5 shadow-lg select-none cursor-grab active:cursor-grabbing backdrop-blur-md',
                variantClasses[toast.variant] ?? variantClasses.default,
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon per variant (Success ✅, Error ❌, Warning ⚠️, Info ℹ️) */}
                <div className="mt-0.5 shrink-0" aria-hidden="true">
                  {isSuccess && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
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
                  {isError && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-destructive/20 text-destructive dark:text-red-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                  )}
                  {isWarning && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                  )}
                  {!isSuccess && !isError && !isWarning && (
                    <div className="flex size-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="13"
                        height="13"
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

                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-snug text-foreground">
                    {toast.title}
                  </p>
                  {toast.description ? (
                    <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                      {toast.description}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  data-testid="toast-close-btn"
                  onClick={() => dismiss(toast.id)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer p-1 rounded hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Cerrar notificación"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
