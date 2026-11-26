import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Inbox,
  ListTodo,
  ShieldAlert,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityBadge, StatusBadge } from '@/components/ui/status-badge'
import { priorityMeta, statusMeta, urgencyLabel } from '@/features/tickets/labels'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { useRole } from '@/hooks/useRole'
import { useGroupsQuery, useGroupQueueQuery, useTicketsQuery } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = 'neutral',
  onClick,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  tone?: 'neutral' | 'primary' | 'warning' | 'danger' | 'success'
  onClick?: () => void
}) {
  const iconTone: Record<typeof tone, string> = {
    neutral: 'bg-muted text-foreground',
    primary: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    danger: 'bg-red-500/15 text-red-700 dark:text-red-300',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  }

  const borderTone: Record<typeof tone, string> = {
    neutral: 'border-border hover:border-primary/40',
    primary: 'border-blue-200 dark:border-blue-900/70 hover:border-blue-400',
    warning: 'border-amber-300 dark:border-amber-800/80 hover:border-amber-500',
    danger: 'border-red-300 dark:border-red-800/80 hover:border-red-500',
    success: 'border-emerald-200 dark:border-emerald-900/70 hover:border-emerald-400',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group text-left w-full rounded-xl border bg-card p-4 shadow-xs transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        borderTone[tone],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', iconTone[tone])}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        <ArrowRight
          className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all"
          aria-hidden="true"
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
    </button>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const setSelectedAssigneeId = useUiStore((state) => state.setSelectedAssigneeId)
  const userId = useAuthStore((state) => state.user?.userId ?? null)
  const { isAdmin, isSupervisor, isTechnician } = useRole()

  const navigateToTickets = (status?: number) => {
    if (!isTechnician) {
      setSelectedAssigneeId(null)
    }
    navigate(status != null ? `/tickets?status=${status}` : '/tickets')
  }

  const groups = useGroupsQuery()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const currentGroup =
    groups.data?.find((group) => group.id === selectedGroupId) ??
    (groups.data && groups.data.length > 0 ? groups.data[0] : null)
  const effectiveGroupId = currentGroup?.id ?? null
  const effectiveGroupName = currentGroup?.name ?? 'Sin grupo'
  const groupQueue = useGroupQueueQuery(effectiveGroupId)
  const assigned = useTicketsQuery(userId ?? null)
  const stats = useDashboardStatsQuery()

  const dbStats = stats.data
  const assignedItems = assigned.data?.items ?? []

  const totalInScope = dbStats?.totalTickets ?? assignedItems.length
  const scopeLabel = isAdmin
    ? 'Métricas globales de la instancia'
    : isSupervisor
      ? 'Métricas de tus grupos supervisados'
      : 'Métricas personales (tickets asignados)'
  const assignedOpenCount = dbStats?.openTickets ?? assignedItems.filter((t) => [1, 2, 3, 4].includes(t.status)).length
  const ticketsNuevos = dbStats?.newTickets ?? assignedItems.filter((t) => t.status === 1).length
  const ticketsEnProgreso = dbStats?.executionTickets ?? dbStats?.assignedTickets ?? assignedItems.filter((t) => t.status === 2).length
  const ticketsPlanificados = dbStats?.plannedTickets ?? assignedItems.filter((t) => t.status === 3).length
  const ticketsEnPausa = dbStats?.pausedTickets ?? dbStats?.pendingTickets ?? assignedItems.filter((t) => t.status === 4).length
  const ticketsResueltos = dbStats?.solvedTickets ?? assignedItems.filter((t) => t.status === 5).length
  const ticketsCerrados = dbStats?.closedTickets ?? assignedItems.filter((t) => t.status === 6).length
  const ticketsVencidos = dbStats?.overdueTickets ?? assignedItems.filter((t) => {
    if (t.status >= 5 || !t.timeToResolve) return false
    const time = new Date(t.timeToResolve).getTime()
    return !isNaN(time) && time < Date.now()
  }).length
  const ticketsProximos = dbStats?.dueSoonTickets ?? 0
  const tareasProgramadas = dbStats?.scheduledTasksCount ?? 0

  const now = new Date()
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const solvedToday = assignedItems.filter((t) => {
    if (!t.solvedAt) return false
    const d = new Date(t.solvedAt)
    if (isNaN(d.getTime())) return false
    const dLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return dLocal === todayLocal
  })

  const queueCount = groupQueue.data?.total ?? 0
  const groupItems = groupQueue.data?.items ?? []

  const statusBreakdown = [
    { status: 1, label: '1. Nuevo', count: ticketsNuevos },
    { status: 2, label: '2. Asignado', count: ticketsEnProgreso },
    { status: 3, label: '3. En proceso (planificado)', count: ticketsPlanificados },
    { status: 4, label: '4. Pendiente', count: ticketsEnPausa },
    { status: 5, label: '5. Resuelto', count: ticketsResueltos },
    { status: 6, label: '6. Cerrado', count: ticketsCerrados },
  ]
  const breakdownTotal = Math.max(
    1,
    statusBreakdown.reduce((sum, item) => sum + item.count, 0),
  )

  const pageTitle = isAdmin ? 'Dashboard global' : isSupervisor ? 'Dashboard de supervisión' : 'Dashboard operativo'

  if (
    groups.isLoading ||
    (effectiveGroupId && groupQueue.isLoading) ||
    assigned.isLoading ||
    stats.isLoading
  ) {
    return (
      <div className="space-y-6 pb-6">
        <PageHeader
          title={pageTitle}
          description="Resumen operativo en tiempo real de los tickets en tu alcance."
          breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dashboard' }]}
        />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const hasError = groups.isError || groupQueue.isError || assigned.isError || stats.isError
  if (hasError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={pageTitle}
          description="Resumen operativo en tiempo real."
          breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dashboard' }]}
        />
        <ErrorState
          message={getApiErrorMessage(groups.error ?? groupQueue.error ?? assigned.error ?? stats.error)}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title={pageTitle}
        description={`${scopeLabel} · Cola: ${effectiveGroupName} · ${totalInScope} ticket(s) totales en alcance.`}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dashboard' }]}
        actions={
          (groups.data?.length ?? 0) > 1 ? (
            <DropdownSelect
              aria-label="Grupo de la cola"
              value={effectiveGroupId ? String(effectiveGroupId) : ''}
              onChange={(value) => setSelectedGroupId(Number(value))}
              options={(groups.data ?? []).map((group) => ({
                value: String(group.id),
                label: group.name,
              }))}
              className="w-44 sm:w-52"
              data-testid="dashboard-group-select"
            />
          ) : undefined
        }
      />

      {/* 4 Primary High-Signal KPIs */}
      <section aria-label="Indicadores clave" className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tickets en la cola"
          value={queueCount}
          subtitle={queueCount === 0 ? `${effectiveGroupName}: sin pendientes` : `${effectiveGroupName}: por asignar`}
          icon={Inbox}
          tone={queueCount > 0 ? 'primary' : 'neutral'}
          onClick={() => navigate('/queue')}
        />
        <KpiCard
          title="Activos en gestión"
          value={assignedOpenCount}
          subtitle={`${ticketsEnProgreso} asignados · ${ticketsPlanificados} planificados · ${ticketsEnPausa} en espera`}
          icon={ListTodo}
          tone="neutral"
          onClick={() => navigateToTickets()}
        />
        <KpiCard
          title="Vencimientos SLA"
          value={ticketsVencidos}
          subtitle={
            ticketsVencidos > 0
              ? `${ticketsProximos} próximos a vencer (<24h)`
              : ticketsProximos > 0
                ? `${ticketsProximos} próximos a vencer (<24h)`
                : 'SLA al día sin riesgos críticos'
          }
          icon={ShieldAlert}
          tone={ticketsVencidos > 0 ? 'danger' : ticketsProximos > 0 ? 'warning' : 'neutral'}
          onClick={() => navigateToTickets()}
        />
        <KpiCard
          title="Resueltos"
          value={ticketsResueltos}
          subtitle={
            isTechnician
              ? `${solvedToday.length} hoy · ${ticketsCerrados} cerrados`
              : `${ticketsCerrados} cerrados en histórico`
          }
          icon={CheckCircle2}
          tone="success"
          onClick={() => navigateToTickets(5)}
        />
      </section>

      {/* Secondary Operational Bar: Scheduled Tasks & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            <CalendarClock className="size-3.5 text-primary" aria-hidden="true" />
            <span>
              <strong className="tabular-nums">{tareasProgramadas}</strong>{' '}
              {tareasProgramadas === 1 ? 'tarea planificada activa' : 'tareas planificadas activas'}
            </span>
          </span>
          <span className="hidden sm:inline text-border">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>
              Próximos a vencer (&lt;24h): <strong className="text-foreground tabular-nums">{ticketsProximos}</strong>
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate('/kanban')} className="h-7 text-xs">
            Ir al Kanban
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/tickets')} className="h-7 text-xs">
            Ver todos los tickets
          </Button>
        </div>
      </div>

      {/* Main Actionable Split: Group Queue (2/3) + Interactive Status Distribution (1/3) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="dashboard-queue-heading" className="lg:col-span-2 min-w-0 space-y-3">
          <SectionHeader
            id="dashboard-queue-heading"
            title={`Próximos en la cola de ${effectiveGroupName}`}
            description="Tickets del grupo disponibles para revisión o auto-asignación."
            count={queueCount}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/queue')}
                disabled={effectiveGroupId === null}
                className="gap-1.5"
              >
                <Inbox className="size-3.5" aria-hidden="true" />
                Ver cola ({queueCount})
              </Button>
            }
          />

          {groupItems.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Cola del grupo al día"
              description="No hay tickets sin asignar en este momento."
              compact
            />
          ) : (
            <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
              {groupItems.slice(0, 6).map((t) => {
                const priority = priorityMeta(t.priority)
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-l-[3px] hover:bg-muted/40 transition-colors',
                      priority.stripeClass,
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          to={`/tickets/${t.id}`}
                          className="font-mono text-xs font-semibold text-muted-foreground hover:text-primary shrink-0"
                        >
                          #{t.id}
                        </Link>
                        <Link
                          to={`/tickets/${t.id}`}
                          className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                          title={t.title}
                        >
                          {t.title}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <PriorityBadge priority={t.priority} size="sm" />
                        <StatusBadge status={t.status} size="sm" />
                        <span>Urgencia {urgencyLabel(t.urgency)}</span>
                        <span>· {formatRelative(t.createdAt)}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/tickets/${t.id}`)}
                      className="shrink-0 self-start sm:self-center"
                    >
                      Ver detalle
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="dashboard-distribution-heading" className="min-w-0 space-y-3">
          <SectionHeader
            id="dashboard-distribution-heading"
            title="Distribución por Estado"
            description="Haz clic en un estado para filtrar la lista."
          />

          <Card className="rounded-xl border-border bg-card shadow-xs">
            <CardContent className="p-4 space-y-2.5">
              {statusBreakdown.map((item) => {
                const meta = statusMeta(item.status)
                const pct = Math.round((item.count / breakdownTotal) * 100)
                return (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => navigateToTickets(item.status)}
                    className="w-full text-left rounded-lg p-2 hover:bg-muted/60 transition-colors cursor-pointer space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-medium text-foreground">
                        <span className={cn('size-2 rounded-full shrink-0', meta.dotClass)} aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {item.count}{' '}
                        <span className="text-muted-foreground font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300', meta.dotClass)}
                        style={{ width: `${item.count > 0 ? Math.max(4, pct) : 0}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
