import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDashboardQuery } from '@/hooks/useTickets'

/**
 * Admin view: "Administración" — global overview of all groups.
 * Consumes GET /api/admin/groups-summary.
 */
export function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboardQuery()

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
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar el resumen de administración.</p>
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
