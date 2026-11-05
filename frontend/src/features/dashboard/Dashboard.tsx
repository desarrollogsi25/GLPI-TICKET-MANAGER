import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  ListTodo,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
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
  icon: Icon,
  variant = 'default',
  onClick,
}: {
  title: string
  value: number
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'success'
  onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  const variantStyles = {
    default: 'hover:border-primary/50',
    primary: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60',
    warning: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60',
    danger: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/60',
    success: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60',
  }

  return (
    <Card className={cn('transition-all rounded-2xl shadow-xs', onClick && 'cursor-pointer', variantStyles[variant])}>
      <CardContent className="p-4 space-y-2">
        <Tag
          {...(onClick ? { onClick, type: 'button' } : {})}
          className="text-left w-full"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            {Icon && <Icon className="size-4 text-muted-foreground/70" />}
          </div>
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {subtitle ? <p className="text-xs text-muted-foreground truncate">{subtitle}</p> : null}
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

  const dbStats = stats.data
  const assignedItems = assigned.data?.items ?? []

  // Totales agregados directos desde backend SQL (soporta > 100 tickets sin truncar)
  const totalAssigned = dbStats?.assignedTickets ?? (dbStats ? (dbStats.newTickets + (dbStats.executionTickets ?? 0) + (dbStats.plannedTickets ?? 0) + (dbStats.pausedTickets ?? 0)) : assignedItems.length)
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

  const today = new Date().toISOString().slice(0, 10)
  const solvedToday = assignedItems.filter(
    (t) => t.solvedAt && t.solvedAt.slice(0, 10) === today,
  )

  const queueCount = groupQueue.data?.total ?? 0
  const groupItems = groupQueue.data?.items ?? []

  if (
    groups.isLoading ||
    (effectiveGroupId && groupQueue.isLoading) ||
    assigned.isLoading ||
    stats.isLoading
  ) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard del Agente"
          description="Resumen operativo en tiempo real de tus tickets asignados y flujo de trabajo."
          breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dashboard' }]}
        />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const hasError = groups.isError || groupQueue.isError || assigned.isError || stats.isError
  if (hasError) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm space-y-3">
        <p>{getApiErrorMessage(groups.error ?? groupQueue.error ?? assigned.error ?? stats.error)}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard del Agente"
        description="Resumen operativo en tiempo real de tus tickets asignados y flujo de trabajo."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Dashboard' }]}
      />

      {/* Métricas Principales del Técnico */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Tickets en mi cola"
          value={queueCount}
          subtitle={queueCount === 0 ? 'Cola al día' : `${queueCount} por asignar`}
          icon={Inbox}
          variant="primary"
          onClick={() => navigate('/queue')}
        />
        <StatCard
          title="Total Asignados"
          value={totalAssigned}
          subtitle={`${assignedOpenCount} activos / abiertos`}
          icon={ListTodo}
          variant="default"
          onClick={() => navigate('/tickets')}
        />
        <StatCard
          title="En Ejecución"
          value={ticketsEnProgreso}
          subtitle="Trabajando activamente (GLPI 2)"
          icon={PlayCircle}
          variant="primary"
          onClick={() => navigate('/tickets?status=2')}
        />
        <StatCard
          title="Planificados"
          value={ticketsPlanificados}
          subtitle={`${tareasProgramadas} tareas programadas (GLPI 3)`}
          icon={Calendar}
          variant="default"
          onClick={() => navigate('/tickets?status=3')}
        />
        <StatCard
          title="En Espera / Pausa"
          value={ticketsEnPausa}
          subtitle="Pendiente usuario o repuesto (GLPI 4)"
          icon={PauseCircle}
          variant="warning"
          onClick={() => navigate('/tickets?status=4')}
        />
        <StatCard
          title="Abiertos / Nuevos"
          value={ticketsNuevos}
          subtitle="Por iniciar gestión (GLPI 1)"
          icon={Clock}
          variant="default"
          onClick={() => navigate('/tickets?status=1')}
        />
        <StatCard
          title="Resueltos"
          value={ticketsResueltos}
          subtitle={`${solvedToday.length} resueltos hoy (GLPI 5)`}
          icon={CheckCircle2}
          variant="success"
          onClick={() => navigate('/tickets?status=5')}
        />
        <StatCard
          title="Cerrados"
          value={ticketsCerrados}
          subtitle="Histórico finalizado (GLPI 6)"
          icon={CheckCircle2}
          variant="default"
          onClick={() => navigate('/tickets?status=6')}
        />
        <StatCard
          title="Próximos a Vencer (<24h)"
          value={ticketsProximos}
          subtitle={ticketsProximos === 0 ? 'Sin riesgos próximos' : 'Atención preventiva recomendada'}
          icon={Clock}
          variant={ticketsProximos > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/tickets')}
        />
        <StatCard
          title="Vencimientos Críticos"
          value={ticketsVencidos}
          subtitle={ticketsVencidos === 0 ? 'SLA al día' : 'SLA o fecha límite vencida'}
          icon={ShieldAlert}
          variant={ticketsVencidos > 0 ? 'danger' : 'default'}
          onClick={() => navigate('/tickets')}
        />
      </div>

      {/* Cola de Grupo y Tareas Inmediatas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Próximos en la cola del grupo</h2>
              <p className="text-xs text-muted-foreground">Tickets disponibles para auto-asignación</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/queue')}
              disabled={effectiveGroupId === null}
              className="gap-1.5"
            >
              <Inbox className="size-3.5" />
              Ver cola ({queueCount})
            </Button>
          </div>

          {groupItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground bg-card/40"
            >
              <CheckCircle2 className="mx-auto size-7 text-emerald-500/60 mb-2" />
              No hay tickets pendientes en la cola de tu grupo. ¡Todo al día!
            </motion.div>
          ) : (
            <div className="space-y-2">
              {groupItems.slice(0, 5).map((t) => {
                const priority = priorityMeta(t.priority)
                const status = statusMeta(t.status)
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-card/60 p-3.5 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">#{t.id}</span>
                        <span className="truncate text-sm font-medium text-foreground">{t.title}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', priority.badgeClass)}>
                          {priority.label}
                        </span>
                        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', status.badgeClass)}>
                          {status.label}
                        </span>
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
        </div>

        {/* Resumen por Estado de Tickets */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Distribución por Estado</h2>
            <p className="text-xs text-muted-foreground">Balance general del flujo de soporte</p>
          </div>

          <Card className="rounded-2xl border-border/70 bg-card/60 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">1. Nuevo / Abierto</span>
                <span className="font-semibold tabular-nums">{ticketsNuevos}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">2. En Proceso (Asignado)</span>
                <span className="font-semibold tabular-nums">{ticketsEnProgreso}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">3. En Proceso (Planificado)</span>
                <span className="font-semibold tabular-nums">{ticketsPlanificados}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">4. En Espera / Pausa</span>
                <span className="font-semibold tabular-nums">{ticketsEnPausa}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">5. Resuelto</span>
                <span className="font-semibold tabular-nums">{ticketsResueltos}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">6. Cerrado</span>
                <span className="font-semibold tabular-nums">{ticketsCerrados}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
