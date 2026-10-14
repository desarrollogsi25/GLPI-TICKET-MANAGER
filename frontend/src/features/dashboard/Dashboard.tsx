import { useNavigate } from 'react-router-dom'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupsQuery, useGroupQueueQuery, useTicketsQuery } from '@/hooks/useTickets'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { useAuthStore } from '@/store/authStore'
import { getApiErrorMessage } from '@/lib/api/errors'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { priorityMeta, statusMeta } from '@/features/tickets/labels'

function StatCard({
  title,
  value,
  subtitle,
  onClick,
}: {
  title: string
  value: number
  subtitle?: string
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Card className={onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}>
      <CardContent className="p-4 space-y-2">
        <Tag
          {...(onClick ? { onClick, type: 'button' } : {})}
          className="text-left w-full"
        >
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </Tag>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const userId = useAuthStore((state) => state.user?.userId ?? null)
  const groups = useGroupsQuery()
  const effectiveGroupId =
    groups.data && groups.data.length > 0 ? groups.data[0].id : null
  const groupQueue = useGroupQueueQuery(effectiveGroupId)
  const assigned = useTicketsQuery(userId ?? null)
  const stats = useDashboardStatsQuery()

  const assignedItems = assigned.data?.items ?? []
  const assignedOpen = assignedItems.filter((t) =>
    [1, 2, 3, 4].includes(t.status),
  )
  const today = new Date().toISOString().slice(0, 10)
  const solvedToday = assignedItems.filter(
    (t) => t.solvedAt && t.solvedAt.slice(0, 10) === today,
  )

  const queueCount = groupQueue.data?.total ?? 0
  const groupItems = groupQueue.data?.items ?? []

  if (groups.isLoading || (effectiveGroupId && groupQueue.isLoading) || assigned.isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const hasError = groups.isError || groupQueue.isError || assigned.isError
  if (hasError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm space-y-3">
        <p>{getApiErrorMessage(groups.error ?? groupQueue.error ?? assigned.error)}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard del agente</h1>
        <p className="text-sm text-muted-foreground">
          Lo que requiere tu atencion ahora.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Tickets en mi cola"
          value={queueCount}
          subtitle={queueCount === 0 ? 'Todo al dia' : 'Sin asignar'}
          onClick={() => navigate('/queue')}
        />
        <StatCard
          title="Mis tickets asignados abiertos"
          value={assignedOpen.length}
          subtitle={assignedItems.length === 0 ? 'Sin asignaciones' : `${assignedItems.length} en total`}
          onClick={() => navigate('/tickets')}
        />
        <StatCard
          title="Resueltos por mi hoy"
          value={solvedToday.length}
          subtitle={today}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          title="Sin asignar en mi grupo"
          value={queueCount}
          subtitle={groups.data?.[0]?.name ?? 'Grupo'}
          onClick={() => navigate('/queue')}
        />
        <StatCard
          title="Total abiertos en el sistema"
          value={stats.data?.openTickets ?? 0}
          subtitle="Reporte global"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Proximos en la cola</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/queue')}
            disabled={effectiveGroupId === null}
          >
            Ir a la cola
          </Button>
        </div>
        {groupItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No hay tickets pendientes.
          </div>
        ) : (
          <div className="space-y-2">
            {groupItems.slice(0, 5).map((t) => {
              const priority = priorityMeta(t.priority)
              const status = statusMeta(t.status)
              return (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <span className="mr-2 font-medium">#{t.id}</span>
                    <span className="truncate text-muted-foreground">{t.title}</span>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn('rounded px-2 py-0.5', priority.badgeClass)}>{priority.label}</span>
                      <span className={cn('rounded px-2 py-0.5', status.badgeClass)}>{status.label}</span>
                      <span>{formatRelative(t.createdAt)}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/tickets/${t.id}`)}>
                    Ver
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {stats.data ? (
        <div className="grid gap-4 lg:grid-cols-1">
          <div className="rounded-md border border-border p-4">
            <p className="mb-2 text-sm font-medium text-muted-foreground">Tickets por estado (global)</p>
            <div className="flex flex-wrap gap-2">
              {stats.data.byStatus.map((b) => (
                <span key={b.status} className={cn('rounded px-2 py-0.5 text-sm', statusMeta(b.status).badgeClass)}>
                  {statusMeta(b.status).label} {b.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
