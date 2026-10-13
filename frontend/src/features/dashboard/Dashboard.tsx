import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { getApiErrorMessage } from '@/lib/api/errors'
import { formatNumber } from '@/lib/format'

import { statusMeta } from '@/features/tickets/labels'

import { BarChart } from './BarChart'

interface CounterProps {
  label: string
  value: string
}

function Counter({ label, value }: CounterProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: stats, isLoading, isError, error } = useDashboardStatsQuery()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        {getApiErrorMessage(error)}
      </p>
    )
  }

  const byStatus = stats.byStatus.map((item) => ({
    label: statusMeta(item.status).label,
    value: item.count,
  }))

  const byTechnician = stats.byTechnician.map((item) => ({
    label: `Técnico #${item.userId}`,
    value: item.openTickets,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Métricas agregadas de tickets.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Counter label="Total" value={formatNumber(stats.totalTickets)} />
        <Counter label="Abiertos" value={formatNumber(stats.openTickets)} />
        <Counter label="Nuevos" value={formatNumber(stats.newTickets)} />
        <Counter label="Asignados" value={formatNumber(stats.assignedTickets)} />
        <Counter label="Pendientes" value={formatNumber(stats.pendingTickets)} />
        <Counter label="Resueltos" value={formatNumber(stats.solvedTickets)} />
        <Counter label="Cerrados" value={formatNumber(stats.closedTickets)} />
        <Counter label="Vencidos (SLA)" value={formatNumber(stats.overdueTickets)} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tiempo medio de resolución
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tracking-tight">
            {stats.averageResolutionHours != null
              ? `${formatNumber(Math.round(stats.averageResolutionHours))} h`
              : '—'}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChart title="Tickets por estado" data={byStatus} />
        <BarChart
          title="Carga por técnico"
          description="Tickets abiertos por técnico asignado."
          data={byTechnician}
        />
      </div>
    </div>
  )
}
