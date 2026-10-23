import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

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

/** Auto-dismiss duration for non-error toasts (3-4s per H-41). */
export const AUTO_DISMISS_MS = 3500
/** Maximum visible toasts at once per H-41. */
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

/** Professional toast store (H-41): max 3 visible, persistent errors, 3.5s auto-dismiss for others. */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = generateId()
    set((state) => {
      // Avoid duplicate consecutive toast with identical title + description
      const deduped = state.toasts.filter(
        (t) => !(t.title === toast.title && (t.description ?? '') === (toast.description ?? '')),
      )
      const next = [...deduped, { ...toast, id }]
      return { toasts: next.slice(-MAX_VISIBLE_TOASTS) }
    })

    // H-41: Error toasts are persistent until closed by the user; Success/Info/Warning auto-dismiss in 3.5s.
    if (!isErrorVariant(toast.variant)) {
      window.setTimeout(() => {
        get().dismiss(id)
      }, AUTO_DISMISS_MS)
    }
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
