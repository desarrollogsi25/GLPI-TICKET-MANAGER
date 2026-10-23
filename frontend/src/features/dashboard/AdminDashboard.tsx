import { Building2, Clock, Layers, Users } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminDashboardQuery } from '@/hooks/useTickets'

/**
 * Admin view: "Administración" — global overview of all groups (H-42).
 * Consumes GET /api/admin/groups-summary.
 */
export function AdminDashboard() {
  const { data, isLoading, isError } = useAdminDashboardQuery()
  const groups = data ?? []

  const totalTickets = groups.reduce((acc, g) => acc + (g.totalTickets ?? 0), 0)
  const totalPending = groups.reduce((acc, g) => acc + (g.pendingTickets ?? 0), 0)
  const totalTechs = groups.reduce((acc, g) => acc + (g.activeTechnicians ?? 0), 0)

  const kpiCards = [
    {
      id: 'groups',
      label: 'Grupos activos',
      value: groups.length,
      icon: Building2,
      iconClass: 'text-primary bg-primary/10',
    },
    {
      id: 'tickets',
      label: 'Tickets totales',
      value: totalTickets,
      icon: Layers,
      iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    },
    {
      id: 'pending',
      label: 'En espera (Pendientes)',
      value: totalPending,
      icon: Clock,
      iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
    },
    {
      id: 'techs',
      label: 'Técnicos asignados',
      value: totalTechs,
      icon: Users,
      iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Administración"
        description="Vista global de todos los grupos de soporte."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Administración' }]}
      />

      {/* Tarjetas de resumen global con NumberTicker */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="admin-kpi-cards"
      >
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.id} className="shadow-xs border-border/70">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <span
                    className={`flex size-8 items-center justify-center rounded-lg ${kpi.iconClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                {isLoading ? (
                  <Skeleton className="mt-2.5 h-7 w-16" />
                ) : (
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    <NumberTicker value={kpi.value} />
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="shadow-xs border-border/70">
        <CardHeader className="pb-3 border-b border-border/50">
          <CardTitle className="text-base font-semibold">Resumen por grupo</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar el resumen de administración.</p>
          ) : (
            <>
              {/* Vista móvil: Cards apiladas */}
              <div className="grid grid-cols-1 gap-3 md:hidden" data-testid="admin-mobile-cards">
                {groups.map((g) => (
                  <div
                    key={g.groupId}
                    className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{g.groupName}</span>
                      <Badge variant="secondary">{g.activeTechnicians} técnicos</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-background p-2 border border-border/50">
                        <span className="text-muted-foreground">Tickets totales: </span>
                        <span className="font-bold tabular-nums">{g.totalTickets}</span>
                      </div>
                      <div className="rounded-lg bg-background p-2 border border-border/50">
                        <span className="text-muted-foreground">Pendientes: </span>
                        <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                          {g.pendingTickets}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabla desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" data-testid="admin-groups-table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pr-4">Grupo</th>
                      <th className="py-3 pr-4">Tickets totales</th>
                      <th className="py-3 pr-4">Pendientes</th>
                      <th className="py-3">Técnicos activos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {groups.map((g) => (
                      <tr
                        key={g.groupId}
                        className="transition-colors duration-150 hover:bg-muted/40"
                      >
                        <td className="py-3 pr-4 font-semibold text-foreground">{g.groupName}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary" className="tabular-nums">
                            {g.totalTickets}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className="tabular-nums">
                            {g.pendingTickets}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 tabular-nums">
                            {g.activeTechnicians}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {groups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          Sin datos de grupos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
