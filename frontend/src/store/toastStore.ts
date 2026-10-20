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

function generateId(): string {
  try {
    return uuidv4()
  } catch {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }
}

/** Minimal toast store: no extra dependency, rendered by <Toaster />. */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    // uuid with fallback for insecure contexts (LAN http by IP) where crypto.randomUUID is undefined.
    const id = generateId()
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))

    window.setTimeout(() => {
      get().dismiss(id)
    }, AUTO_DISMISS_MS)
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}))
