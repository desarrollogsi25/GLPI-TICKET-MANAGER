import { Label } from '@/components/ui/label'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { useRole } from '@/hooks/useRole'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useTechniciansQuery } from '@/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

/**
 * Picks which technician's queue is being viewed.
 * Options come from the GLPI technicians endpoint with real names.
 *
 * Technicians always work on their own queue (the view auto-scopes to them), so the
 * dropdown is only rendered for admins and supervisors auditing other technicians.
 */
export function TechnicianFilter() {
  const { isTechnician } = useRole()
  const selectedAssignee = useSelectedAssignee()
  const setSelectedAssigneeId = useUiStore((state) => state.setSelectedAssigneeId)
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null)
  const { data: technicians } = useTechniciansQuery()

  if (isTechnician) {
    return null
  }

  const list = technicians ?? []

  return (
    <div className="space-y-1">
      <Label htmlFor="technician-filter">Técnico</Label>
      <DropdownSelect
        id="technician-filter"
        className="w-48"
        value={selectedAssignee != null ? String(selectedAssignee) : ''}
        onChange={(value) => setSelectedAssigneeId(value === '' ? null : Number(value))}
        placeholder="Todos los técnicos"
        options={[
          { value: '', label: 'Todos los técnicos' },
          ...list.map((tech) => ({
            value: String(tech.id),
            label:
              tech.id === currentUserId
                ? `${tech.displayName || tech.username} (yo)`
                : tech.displayName || tech.username,
          })),
        ]}
      />
    </div>
  )
}
