import { useState } from 'react'
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

import { DropdownSelect } from '@/components/ui/dropdown-select'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGroupsQuery, useGroupQueueQuery, useTicketsQuery } from '@/hooks/useTickets'
import { useDashboardStatsQuery } from '@/hooks/useDashboardStats'
import { useRole } from '@/hooks/useRole'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
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
  // Scope is explicit: the queue cards belong to the selected group, while the
  // counters below are personal (every group the user belongs to).
  const effectiveGroupName = currentGroup?.name ?? 'Sin grupo'
  const groupQueue = useGroupQueueQuery(effectiveGroupId)
  const assigned = useTicketsQuery(userId ?? null)
  const stats = useDashboardStatsQuery()

  const dbStats = stats.data
  const assignedItems = assigned.data?.items ?? []

  // Totales agregados directos desde backend SQL (soporta > 100 tickets sin truncar).
  // El alcance lo decide el backend: admin = global, supervisor = sus grupos,
  // técnico = solo los tickets asignados a él.
  const totalInScope = dbStats?.totalTickets ?? assignedItems.length
  const scopeLabel = isAdmin
    ? 'Métricas globales de la instancia'
    : isSupervisor
      ? 'Métricas de tus grupos supervisados'
      : 'Métricas personales (tickets asignados a vos)'
  const totalCardTitle = isAdmin ? 'Tickets totales' : isSupervisor ? 'Tickets del grupo' : 'Total asignados'
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
          title={isAdmin ? 'Dashboard global' : isSupervisor ? 'Dashboard de supervisión' : 'Dashboard del Agente'}
          description="Resumen operativo en tiempo real de los tickets en tu alcance."
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
        title={isAdmin ? 'Dashboard global' : isSupervisor ? 'Dashboard de supervisión' : 'Dashboard del Agente'}
        description={`Resumen operativo en tiempo real. ${scopeLabel} · Cola: ${effectiveGroupName}.`}
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
              className="w-44 sm:w-48"
              data-testid="dashboard-group-select"
            />
          ) : undefined
        }
      />

      {/* Métricas Principales del Técnico */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Tickets en la cola"
          value={queueCount}
          subtitle={queueCount === 0 ? `${effectiveGroupName}: al día` : `${effectiveGroupName}: ${queueCount} por asignar`}
          icon={Inbox}
          variant="primary"
          onClick={() => navigate('/queue')}
        />
        <StatCard
          title={totalCardTitle}
          value={totalInScope}
          subtitle={`${assignedOpenCount} activos / abiertos`}
          icon={ListTodo}
          variant="default"
          onClick={() => navigateToTickets()}
        />
        <StatCard
          title="Asignados"
          value={ticketsEnProgreso}
          subtitle={isTechnician ? 'Asignados a ti, sin planificar (GLPI 2)' : 'Sin planificar (GLPI 2)'}
          icon={PlayCircle}
          variant="primary"
          onClick={() => navigateToTickets(2)}
        />
        <StatCard
          title="Planificados"
          value={ticketsPlanificados}
          subtitle={`${tareasProgramadas} tareas activas en GLPI`}
          icon={Calendar}
          variant="default"
          onClick={() => navigateToTickets(3)}
        />
        <StatCard
          title="En Espera / Pausa"
          value={ticketsEnPausa}
          subtitle="Pendiente usuario o repuesto (GLPI 4)"
          icon={PauseCircle}
          variant="warning"
          onClick={() => navigateToTickets(4)}
        />
        <StatCard
          title="Abiertos / Nuevos"
          value={ticketsNuevos}
          subtitle="Por iniciar gestión (GLPI 1)"
          icon={Clock}
          variant="default"
          onClick={() => navigateToTickets(1)}
        />
        <StatCard
          title="Resueltos"
          value={ticketsResueltos}
          subtitle={isTechnician ? `${solvedToday.length} resueltos hoy (GLPI 5)` : 'Solucionados (GLPI 5)'}
          icon={CheckCircle2}
          variant="success"
          onClick={() => navigateToTickets(5)}
        />
        <StatCard
          title="Cerrados"
          value={ticketsCerrados}
          subtitle="Histórico finalizado (GLPI 6)"
          icon={CheckCircle2}
          variant="default"
          onClick={() => navigateToTickets(6)}
        />
        <StatCard
          title="Próximos a Vencer (<24h)"
          value={ticketsProximos}
          subtitle={ticketsProximos === 0 ? 'Sin riesgos próximos' : 'Atención preventiva recomendada'}
          icon={Clock}
          variant={ticketsProximos > 0 ? 'warning' : 'default'}
          onClick={() => navigateToTickets()}
        />
        <StatCard
          title="Vencimientos Críticos"
          value={ticketsVencidos}
          subtitle={ticketsVencidos === 0 ? 'SLA al día' : 'SLA o fecha límite vencida'}
          icon={ShieldAlert}
          variant={ticketsVencidos > 0 ? 'danger' : 'default'}
          onClick={() => navigateToTickets()}
        />
      </div>

      {/* Cola de Grupo y Tareas Inmediatas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Próximos en la cola de {effectiveGroupName}</h2>
              <p className="text-xs text-muted-foreground">Tickets del grupo seleccionado disponibles para auto-asignación</p>
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
                <span className="text-muted-foreground">2. Asignado</span>
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
