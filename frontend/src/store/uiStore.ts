import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface TicketTask {
  id: string
  label: string
  done: boolean
}

interface UiState {
  /** Technician currently being viewed. `null` falls back to the logged-in user. */
  selectedAssigneeId: number | null
  setSelectedAssigneeId: (assigneeId: number | null) => void

  /**
   * Per-ticket subtask checklist. This is purely client-side UI state:
   * the API has no tasks endpoint yet, so it lives in the browser.
   */
  tasks: Record<number, TicketTask[]>
  addTask: (ticketId: number, label: string) => void
  toggleTask: (ticketId: number, taskId: string) => void
  removeTask: (ticketId: number, taskId: string) => void
}

function generateId(): string {
  try {
    return uuidv4()
  } catch {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedAssigneeId: null,
      setSelectedAssigneeId: (selectedAssigneeId) => set({ selectedAssigneeId }),

      tasks: {},
      addTask: (ticketId, label) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [ticketId]: [
              ...(state.tasks[ticketId] ?? []),
              // uuid with fallback for insecure contexts (LAN http by IP) where crypto.randomUUID is undefined.
              { id: generateId(), label, done: false },
            ],
          },
        })),
      toggleTask: (ticketId, taskId) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [ticketId]: (state.tasks[ticketId] ?? []).map((task) =>
              task.id === taskId ? { ...task, done: !task.done } : task,
            ),
          },
        })),
      removeTask: (ticketId, taskId) =>
        set((state) => ({
          tasks: {
            ...state.tasks,
            [ticketId]: (state.tasks[ticketId] ?? []).filter((task) => task.id !== taskId),
          },
        })),
    }),
    { name: 'glpi-ticket-manager.ui' },
  ),
)
