import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupsQuery } from '@/hooks/useTickets'


interface TeamMember {
  userId: number
  name: string
  activeTickets: number
  pendingTickets: number
  currentTicketId: number | null
}

/**
 * Supervisor view: "Mi Equipo" — live table of technicians in the group.
 * Consumes GET /api/groups/{groupId}/dashboard; falls back to mock data if the
 * endpoint is not yet available (backend in progress).
 */
export function TeamDashboard() {
  const groups = useGroupsQuery()
  const groupId = groups.data && groups.data.length > 0 ? groups.data[0].id : null
  // (useAuthStore available for future per-technician filtering)

  const { data, isLoading } = useQuery({
    queryKey: ['groups', 'dashboard', groupId],
    queryFn: async () => {
      if (groupId == null) return []
      try {
        const { data } = await apiClient.get<TeamMember[]>(`/groups/${groupId}/dashboard`)
        return Array.isArray(data) ? data : []
      } catch {
        // Mock fallback while the backend endpoint is not ready.
        return [
          { userId: 7, name: 'tech1', activeTickets: 3, pendingTickets: 1, currentTicketId: 11 },
          { userId: 8, name: 'tech2', activeTickets: 2, pendingTickets: 0, currentTicketId: 57 },
        ]
      }
    },
    enabled: groupId != null,
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mi Equipo"
        description="Vista en vivo del equipo de soporte."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Mi Equipo' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Equipo — Grupo {groupId ?? '—'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4">Técnico</th>
                    <th className="py-2 pr-4">Tickets activos</th>
                    <th className="py-2 pr-4">Pendientes</th>
                    <th className="py-2">Ticket actual</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((m) => (
                    <tr key={m.userId} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{m.name}</td>
                      <td className="py-2 pr-4">{m.activeTickets}</td>
                      <td className="py-2 pr-4">{m.pendingTickets}</td>
                      <td className="py-2">{m.currentTicketId ? `#${m.currentTicketId}` : '—'}</td>
                    </tr>
                  ))}
                  {(data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        Sin datos de equipo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
