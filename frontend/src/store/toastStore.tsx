import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

export type ToastVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive' | 'error'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastState {
  toasts: Toast[]
  push: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

/** Auto-dismiss duration for non-error toasts (3s per H-42). */
export const AUTO_DISMISS_MS = 3000
/** Specific durations per variant (H-60) */
export const DURATION_BY_VARIANT: Record<ToastVariant, number> = {
  default: 4000,
  info: 4000,
  success: 3000,
  warning: 6000,
  destructive: 8000,
  error: 8000,
}
/** Maximum visible toasts at once per H-41 / H-42 / H-60. */
export const MAX_VISIBLE_TOASTS = 3

function generateId(): string {
  try {
    return uuidv4()
  } catch {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }
}

function isErrorVariant(variant: ToastVariant): boolean {
  return variant === 'destructive' || variant === 'error'
}

const variantClasses: Record<ToastVariant, string> = {
  default:
    'border-l-4 border-l-sky-500 border-border/40 bg-card/85 text-card-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
  info:
    'border-l-4 border-l-sky-500 border-border/40 bg-card/85 text-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
  success:
    'border-l-4 border-l-emerald-500 border-border/40 bg-card/85 text-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
  warning:
    'border-l-4 border-l-amber-500 border-border/40 bg-card/85 text-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
  destructive:
    'border-l-4 border-l-red-500 border-border/40 bg-card/85 text-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
  error:
    'border-l-4 border-l-red-500 border-border/40 bg-card/85 text-foreground backdrop-blur-xl shadow-lg dark:border-border/30',
}

/**
 * Professional Toast Store powered by Sonner (H-42 / H-60):
 * - Desktop: top-right, Mobile: top-center (with safe header offset)
 * - Durations: Success (3s), Info (4s), Warning (6s), Error (8s, no-infinite)
 * - Liquid Glass styling with colored accent borders
 * - Icons from Lucide (`CheckCircle2`, `XCircle`, `AlertTriangle`, `Info`)
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toastInput) => {
    const id = generateId()
    const isError = isErrorVariant(toastInput.variant)
    const isWarning = toastInput.variant === 'warning'
    const isSuccess = toastInput.variant === 'success'

    set((state) => {
      const deduped = state.toasts.filter(
        (t) =>
          !(
            t.title === toastInput.title &&
            (t.description ?? '') === (toastInput.description ?? '')
          ),
      )
      const next = [...deduped, { ...toastInput, id }]
      return { toasts: next.slice(-MAX_VISIBLE_TOASTS) }
    })

    sonnerToast.custom(
      (t) => (
        <div
          data-testid="toast-item"
          data-variant={toastInput.variant}
          role={isError ? 'alert' : 'status'}
          className={[
            'pointer-events-auto w-full md:w-[356px] rounded-2xl border p-3.5 shadow-xl select-none backdrop-blur-xl transition-[transform,opacity] duration-200 ease-out',
            variantClasses[toastInput.variant] ?? variantClasses.default,
            isError ? 'toast-error-shake' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0" aria-hidden="true">
              {isSuccess && (
                <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5 stroke-[2.5]" />
                </div>
              )}
              {isError && (
                <div className="flex size-5 items-center justify-center rounded-full bg-destructive/20 text-destructive dark:text-red-400">
                  <XCircle className="size-3.5 stroke-[2.5]" />
                </div>
              )}
              {isWarning && (
                <div className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="size-3.5 stroke-[2.5]" />
                </div>
              )}
              {!isSuccess && !isError && !isWarning && (
                <div className="flex size-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300">
                  <Info className="size-3.5 stroke-[2.5]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-snug text-foreground">
                {toastInput.title}
              </p>
              {toastInput.description ? (
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {toastInput.description}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              data-testid="toast-close-btn"
              onClick={() => {
                sonnerToast.dismiss(t)
                get().dismiss(id)
              }}
              className="text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground cursor-pointer p-1 rounded-md hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Cerrar notificación"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ),
      {
        id,
        duration: DURATION_BY_VARIANT[toastInput.variant] ?? AUTO_DISMISS_MS,
        onDismiss: () => get().dismiss(id),
        onAutoClose: () => get().dismiss(id),
      },
    )

    if (!isError) {
      window.setTimeout(() => {
        get().dismiss(id)
      }, AUTO_DISMISS_MS + 150)
    }
  },
  dismiss: (id) => {
    sonnerToast.dismiss(id)
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }))
  },
}))
