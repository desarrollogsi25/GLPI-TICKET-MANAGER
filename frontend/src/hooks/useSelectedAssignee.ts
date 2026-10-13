import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * Technician currently in scope: an explicit selection from the UI when present,
 * otherwise the logged-in user (a technician watching their own queue).
 */
export function useSelectedAssignee(): number | null {
  const userId = useAuthStore((state) => state.user?.userId ?? null)
  const selectedAssigneeId = useUiStore((state) => state.selectedAssigneeId)

  return selectedAssigneeId ?? userId
}
