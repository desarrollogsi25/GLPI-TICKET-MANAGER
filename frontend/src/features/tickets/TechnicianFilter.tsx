import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * Picks which technician's queue is being viewed.
 * Options come from the dashboard aggregate plus the logged-in user, since the API
 * has no dedicated technicians endpoint.
 */
export function TechnicianFilter() {
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

  return (
    <div className="space-y-1">
      <Label htmlFor="technician-filter">Técnico</Label>
      <Select
        id="technician-filter"
        className="w-44"
        value={selectedAssignee != null ? String(selectedAssignee) : ''}
        onChange={(event) => {
          const value = event.target.value
          setSelectedAssigneeId(value === '' ? null : Number(value))
        }}
      >
        <option value="">Selecciona un técnico</option>
        {options.map((id) => (
          <option key={id} value={id}>
            Técnico #{id}
            {id === currentUserId ? ' (yo)' : ''}
          </option>
        ))}
      </Select>
    </div>
  )
}
