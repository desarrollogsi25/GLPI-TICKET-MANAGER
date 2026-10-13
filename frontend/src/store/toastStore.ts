import { create } from 'zustand'

export type ToastVariant = 'default' | 'success' | 'destructive'

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

const AUTO_DISMISS_MS = 4500

/** Minimal toast store: no extra dependency, rendered by <Toaster />. */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

    window.setTimeout(() => {
      get().dismiss(id)
    }, AUTO_DISMISS_MS)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
