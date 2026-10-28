import { Label } from '@/components/ui/label'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { useRole } from '@/hooks/useRole'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * Picks which technician's queue is being viewed.
 * Options come from the dashboard aggregate plus the logged-in user, since the API
 * has no dedicated technicians endpoint.
 *
 * Technicians always work on their own queue (the view auto-scopes to them), so the
 * dropdown is only rendered for admins and supervisors auditing other technicians.
 */
export function TechnicianFilter() {
  const { isTechnician } = useRole()
  const selectedAssignee = useSelectedAssignee()
  const setSelectedAssigneeId = useUiStore((state) => state.setSelectedAssigneeId)
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null)
  const { data: stats } = useDashboardStatsQuery()

  const ids = new Set<number>()
  if (currentUserId != null) {
    ids.add(currentUserId)
  }
  for (const technician of stats?.byTechnician ?? []) {
    ids.add(technician.userId)
  }
  if (selectedAssignee != null) {
    ids.add(selectedAssignee)
  }

  const options = [...ids].sort((a, b) => a - b)

  if (isTechnician) {
    return null
  }

  return (
    <div className="space-y-1">
      <Label htmlFor="technician-filter">Técnico</Label>
      <DropdownSelect
        id="technician-filter"
        className="w-44"
        value={selectedAssignee != null ? String(selectedAssignee) : ''}
        onChange={(value) => setSelectedAssigneeId(value === '' ? null : Number(value))}
        placeholder="Selecciona un técnico"
        options={[
          { value: '', label: 'Selecciona un técnico' },
          ...options.map((id) => ({
            value: String(id),
            label: `Técnico #${id}${id === currentUserId ? ' (yo)' : ''}`,
          })),
        ]}
      />
    </div>
  )
}
