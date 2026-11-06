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

  // Requesters see tickets they opened; technicians only work on their own queue.
  if (role === 'technician' || role === 'solicitante') {
    return userId
  }

  // Admins and supervisors: if no specific technician was selected in the filter,
  // return null so queries match all tickets across their scope rather than locking
  // to their own admin user id (P2-04).
  return selectedAssigneeId ?? null
}
