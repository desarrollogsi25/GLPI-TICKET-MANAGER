import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

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

const AUTO_DISMISS_MS = 4000

/** Minimal toast store: no extra dependency, rendered by <Toaster />. */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    // uuid works in insecure contexts (LAN http by IP) where crypto.randomUUID is undefined.
    const id = uuidv4()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

    window.setTimeout(() => {
      get().dismiss(id)
    }, AUTO_DISMISS_MS)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
