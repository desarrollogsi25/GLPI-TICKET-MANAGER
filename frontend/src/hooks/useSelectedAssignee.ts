import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * Technician currently in scope: an explicit selection from the UI when present,
 * otherwise the logged-in user (a technician watching their own queue).
 *
 * Technicians only ever see their own queue, so any stale selection left in the UI store
 * by a previous admin/supervisor session is ignored for them.
 */
export function useSelectedAssignee(): number | null {
  const userId = useAuthStore((state) => state.user?.userId ?? null)
  const role = useAuthStore((state) => state.role ?? state.user?.role ?? 'technician')
  const selectedAssigneeId = useUiStore((state) => state.selectedAssigneeId)

  if (role === 'technician') {
    return userId
  }

  return selectedAssigneeId ?? userId
}
