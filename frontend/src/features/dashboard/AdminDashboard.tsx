import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupsQuery } from '@/hooks/useTickets'

interface GroupSummary {
  groupId: number
  groupName: string
  totalTickets: number
  pendingTickets: number
  activeTechnicians: number
}

/**
 * Admin view: "Administración" — global overview of all groups.
 * Consumes GET /api/admin/groups-summary (mock fallback while backend is in progress).
 */
export function AdminDashboard() {
  const groups = useGroupsQuery()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'groups-summary'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<GroupSummary[]>('/admin/groups-summary')
        return Array.isArray(data) ? data : []
      } catch {
        // Mock fallback while the backend endpoint is not ready.
        return (groups.data ?? []).map((g, i) => ({
          groupId: g.id,
          groupName: g.name,
          totalTickets: 10 + i * 3,
          pendingTickets: i,
          activeTechnicians: 2 + i,
        }))
      }
    },
  })

  return (
    <div className="space-y-4">
      <PageHeader
        title="Administración"
        description="Vista global de todos los grupos de soporte."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Administración' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Resumen por grupo</CardTitle>
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
                    <th className="py-2 pr-4">Grupo</th>
                    <th className="py-2 pr-4">Tickets totales</th>
                    <th className="py-2 pr-4">Pendientes</th>
                    <th className="py-2">Técnicos activos</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((g) => (
                    <tr key={g.groupId} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{g.groupName}</td>
                      <td className="py-2 pr-4">{g.totalTickets}</td>
                      <td className="py-2 pr-4">{g.pendingTickets}</td>
                      <td className="py-2">{g.activeTechnicians}</td>
                    </tr>
                  ))}
                  {(data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-muted-foreground">
                        Sin datos de grupos.
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
