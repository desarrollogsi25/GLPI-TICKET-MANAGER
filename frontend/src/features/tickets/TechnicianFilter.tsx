import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { useRole } from '@/hooks/useRole'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useTechniciansQuery } from '@/hooks/useTickets'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

interface TechnicianFilterProps {
  groupId?: number | null
}

/**
 * Picks which technician's queue is being viewed (QA-03, QA-17, QA-18).
 * Options come from the GLPI technicians endpoint with real names.
 *
 * Technicians always work on their own queue (the view auto-scopes to them), so the
 * dropdown is only rendered for admins and supervisors auditing other technicians.
 */
export function TechnicianFilter({ groupId }: TechnicianFilterProps = {}) {
  const { isTechnician } = useRole()
  const selectedAssignee = useSelectedAssignee()
  const setSelectedAssigneeId = useUiStore((state) => state.setSelectedAssigneeId)
  const currentUserId = useAuthStore((state) => state.user?.userId ?? null)
  const { data: technicians } = useTechniciansQuery(groupId)

  const list = technicians ?? []

  // QA-17: Si el técnico seleccionado no pertenece al nuevo grupo cargado, limpiar el filtro.
  useEffect(() => {
    if (selectedAssignee != null && list.length > 0) {
      const isCurrentInGroup = list.some((tech) => Number(tech.id) === Number(selectedAssignee))
      const isOwnScope = selectedAssignee === currentUserId
      if (!isCurrentInGroup && !isOwnScope) {
        setSelectedAssigneeId(null)
      }
    }
  }, [list, selectedAssignee, currentUserId, setSelectedAssigneeId])

  if (isTechnician) {
    return null
  }

  // Filtrar duplicados de 'Mis tickets' en la lista
  const otherTechs = list.filter((tech) => tech.id !== currentUserId)

  const options = [
    { value: '', label: 'Todos los técnicos' },
    { value: '0', label: 'Sin asignar' },
    ...(currentUserId != null
      ? [{ value: String(currentUserId), label: 'Mis tickets' }]
      : []),
    ...otherTechs.map((tech) => ({
      value: String(tech.id),
      label: tech.displayName || tech.username,
    })),
  ]

  return (
    <div className="space-y-1">
      <Label htmlFor="technician-filter">Técnico</Label>
      <DropdownSelect
        id="technician-filter"
        className="w-48"
        value={selectedAssignee != null ? String(selectedAssignee) : ''}
        onChange={(value) => setSelectedAssigneeId(value === '' ? null : Number(value))}
        placeholder="Todos los técnicos"
        options={options}
      />
    </div>
  )
}
