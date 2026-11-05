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
  const role = useAuthStore((state) => state.user?.role ?? state.role ?? 'technician')
  const selectedAssigneeId = useUiStore((state) => state.selectedAssigneeId)

  // Requesters see tickets they opened; the API forces requester scope for that
  // role, so a stale technician selection must never leak into their view.
  if (role === 'technician' || role === 'solicitante') {
    return userId
  }

  return selectedAssigneeId ?? userId
}
