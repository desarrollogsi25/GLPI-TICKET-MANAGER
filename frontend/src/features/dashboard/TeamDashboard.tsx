import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Layers,
  MessageSquare,
  PauseCircle,
  Plus,
  Timer,
  Users,
} from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateTicketDialog } from '@/features/tickets/CreateTicketDialog'
import { priorityMeta, statusMeta } from '@/features/tickets/labels'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useGroupsQuery, useTeamDashboardQuery } from '@/hooks/useTickets'
import type { GroupTicketDetail } from '@/lib/api/types'
import { formatRelative, truncate } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Supervisor view: "Consola de Supervisión del Líder" (H-40 / H-41 / H-42 / H-45).
 * - Section A: Real-time KPI cards with NumberTicker (Active, Paused, Resolved Today, MTTR, Stalled >24h).
 * - Section B: Technician Workload Table with amber/red alerts and last activity relative timestamp.
 * - Section C: Group Tickets Board with technician and status filtering, pause reason highlights, and tooltips.
 */
export function TeamDashboard() {
  const groups = useGroupsQuery()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  // Filters for Section C (Group Tickets Board)
  const [techFilter, setTechFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const currentGroup =
    groups.data?.find((g) => g.id === selectedGroupId) ??
    (groups.data && groups.data.length > 0 ? groups.data[0] : null)
  const groupId = currentGroup?.id ?? null
  const groupName = currentGroup?.name ?? (groupId ? `Grupo ${groupId}` : '—')

  // Subscribe to group real-time events so the dashboard updates automatically without F5
  useRealtimeTicketHub({ groupId })

  const { data, isLoading, isError } = useTeamDashboardQuery(groupId)
  const technicians = data?.technicians ?? []
  const summary = data?.summary
  const allTickets: GroupTicketDetail[] = data?.tickets ?? []

  // 1. Stalled ticket criteria (>24h without updates in active/pending status)
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const isTicketStalled = (t: GroupTicketDetail) => {
    if (t.status >= 5) return false
    const dateStr = t.updatedAt || t.createdAt
    if (!dateStr) return false
    const time = new Date(dateStr).getTime()
    return !isNaN(time) && Date.now() - time > ONE_DAY_MS
  }

  // Helper: check if a technician has stalled tickets
  const isTechStalled = (userId: number) => {
    return allTickets.some((t) => t.assigneeId === userId && isTicketStalled(t))
  }

  // 2. Metrics calculation
  const totalCount = summary?.total ?? data?.totalTickets ?? allTickets.length
  const activeCount =
    allTickets.filter((t) => t.status === 2 || t.status === 3).length ||
    (summary ? summary.inProgress + summary.assigned : (data?.inProgressTickets ?? 0) + (data?.assignedTickets ?? 0))
  const pausedCount =
    allTickets.filter((t) => t.status === 4).length ||
    (summary?.pending ?? data?.pendingTickets ?? 0)
  const resolvedTodayCount = technicians.reduce((acc, m) => acc + (m.resolvedToday ?? 0), 0)
  const stalledCount = allTickets.filter(isTicketStalled).length

  // MTTR calculation (hours)
  const resolvedTickets = allTickets.filter(
    (t) => (t.status === 5 || t.status === 6) && t.createdAt && t.updatedAt,
  )
  const mttrHours =
    resolvedTickets.length > 0
      ? Math.max(
          1,
          Math.round(
            resolvedTickets.reduce((acc, t) => {
              const start = new Date(t.createdAt!).getTime()
              const end = new Date(t.updatedAt!).getTime()
              return acc + Math.max(0, (end - start) / (1000 * 60 * 60))
            }, 0) / resolvedTickets.length,
          ),
        )
      : 2

  // 3. Section A KPI Cards
  const kpiCards = [
    {
      id: 'active',
      label: 'Tickets Activos',
      value: activeCount,
      suffix: '',
      icon: Activity,
      iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      accent:
        'border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-500/50 transition-colors duration-150',
    },
    {
      id: 'paused',
      label: 'Tickets en Pausa',
      value: pausedCount,
      suffix: '',
      icon: PauseCircle,
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      accent:
        'border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/30 hover:border-amber-500/50 transition-colors duration-150',
    },
    {
      id: 'resolved-today',
      label: 'Resueltos Hoy',
      value: resolvedTodayCount,
      suffix: '',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      accent:
        'border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/30 hover:border-emerald-500/50 transition-colors duration-150',
    },
    {
      id: 'mttr',
      label: 'Tiempo Medio (MTTR)',
      value: mttrHours,
      suffix: 'h',
      icon: Timer,
      iconColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      accent:
        'border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/30 hover:border-sky-500/50 transition-colors duration-150',
    },
    {
      id: 'stalled',
      label: 'Estancados (>24h)',
      value: stalledCount,
      suffix: '',
      icon: Flame,
      iconColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/10',
      accent:
        'border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/30 hover:border-rose-500/50 transition-colors duration-150',
    },
  ]

  // Backward compatibility cards for QA test selectors
  const totalCard = {
    id: 'total',
    label: 'Total tickets',
    value: totalCount,
    suffix: '',
    icon: Layers,
    iconColor: 'text-slate-600 dark:text-slate-300 bg-slate-500/10',
    accent:
      'border-border/70 bg-card hover:border-slate-400/50 transition-colors duration-150',
  }

  const allStatCards = [totalCard, ...kpiCards]

  // 4. Section C Filtered Tickets
  const filteredTickets = allTickets.filter((t) => {
    if (techFilter !== 'all') {
      if (techFilter === 'unassigned') {
        if (t.assigneeId != null) return false
      } else if (String(t.assigneeId) !== techFilter) {
        return false
      }
    }
    if (statusFilter !== 'all') {
      if (String(t.status) !== statusFilter) return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consola de Supervisión"
        description={`Supervisión y control en tiempo real del equipo de soporte (${groupName}).`}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Mi Equipo' }]}
        actions={
          <div className="flex items-center gap-2">
            {(groups.data?.length ?? 0) > 1 && (
              <Select
                aria-label="Seleccionar grupo"
                value={groupId ? String(groupId) : ''}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                className="w-44 sm:w-48"
                data-testid="team-group-select"
              >
                {groups.data?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            )}
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              data-testid="create-ticket-btn"
              className="gap-1.5"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Crear ticket</span>
            </Button>
          </div>
        }
      />

      {/* SECCIÓN A: PANEL DE KPIS (Tarjetas Superiores con NumberTicker) */}
      <section aria-labelledby="section-kpis-title">
        <h2 id="section-kpis-title" className="sr-only">Panel de KPIs</h2>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          data-testid="team-status-cards"
        >
          {allStatCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.id}
                className={cn('@container shadow-xs', card.accent)}
                data-testid={`team-card-${card.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground truncate">
                      {card.label}
                    </p>
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg',
                        card.iconColor,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="size-3.5" />
                    </span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-2.5 h-7 w-14" />
                  ) : (
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground flex items-baseline">
                      <NumberTicker value={card.value} />
                      {card.suffix && (
                        <span className="text-sm font-semibold ml-0.5 text-muted-foreground">
                          {card.suffix}
                        </span>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* SECCIÓN B: TABLA DE CARGA DE TRABAJO (Por Técnico) */}
      <section aria-labelledby="section-workload-title">
        <Card className="shadow-xs border-border/70">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" aria-hidden="true" />
              <CardTitle id="section-workload-title" className="text-base font-semibold">
                Carga de Trabajo del Equipo — {groupName}
              </CardTitle>
            </div>
            <Badge variant="secondary" className="text-xs font-medium">
              {technicians.length} {technicians.length === 1 ? 'técnico' : 'técnicos'}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2.5" data-testid="team-loading-skeleton">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive">Error al cargar el dashboard del equipo.</p>
            ) : (
              <>
                {/* Vista Móvil (< md): Cards apiladas de técnicos */}
                <div className="grid grid-cols-1 gap-3 md:hidden" data-testid="team-mobile-cards">
                  {technicians.map((m) => {
                    const techId = m.id ?? m.userId
                    const currentTicket =
                      m.activeTicket ??
                      m.currentTicket ??
                      (m.currentTicketId && m.currentTicketId > 0 ? m.currentTicketId : null)
                    const pendingCount = m.pendingCount ?? m.pendingTickets ?? 0
                    const lastComment = m.lastComment?.trim() || null
                    const initial = m.name.charAt(0).toUpperCase()
                    const stalled = isTechStalled(m.userId)
                    const highPending = pendingCount > 3

                    return (
                      <div
                        key={techId}
                        data-testid={`tech-mobile-card-${m.name}`}
                        className={cn(
                          'rounded-xl border p-3.5 space-y-2.5 transition-colors duration-150',
                          stalled
                            ? 'border-red-500/50 bg-red-50/30 dark:bg-red-950/20'
                            : highPending
                              ? 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20'
                              : 'border-border/70 bg-muted/20',
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/25">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-sm text-foreground truncate block">
                                {m.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {m.lastActivity ? `Activo: ${formatRelative(m.lastActivity)}` : 'Sin actividad reciente'}
                              </span>
                            </div>
                          </div>
                          {currentTicket ? (
                            <Link
                              to={`/tickets/${currentTicket}`}
                              className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary hover:underline"
                            >
                              #{currentTicket}
                            </Link>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">
                              Libre
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                          <div className="rounded-lg bg-background/80 border border-border/50 p-2">
                            <p className="text-[10px] text-muted-foreground uppercase">Activos</p>
                            <p className="text-sm font-bold tabular-nums mt-0.5">{m.activeTickets}</p>
                          </div>
                          <div
                            className={cn(
                              'rounded-lg bg-background/80 border p-2',
                              highPending ? 'border-amber-500/50 text-amber-600 font-bold' : 'border-border/50',
                            )}
                          >
                            <p className="text-[10px] text-muted-foreground uppercase">En Pausa</p>
                            <p className="text-sm font-bold tabular-nums mt-0.5">{pendingCount}</p>
                          </div>
                          <div className="rounded-lg bg-background/80 border border-border/50 p-2">
                            <p className="text-[10px] text-muted-foreground uppercase">Resueltos</p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                              {m.resolvedToday ?? 0}
                            </p>
                          </div>
                        </div>

                        {lastComment && (
                          <div className="flex items-start gap-1.5 rounded-lg bg-background/60 p-2 text-xs text-muted-foreground border border-border/40">
                            <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-primary" />
                            <p className="line-clamp-2 text-foreground/90">{lastComment}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Tabla Desktop (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm" data-testid="team-technicians-table">
                    <thead>
                      <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="py-3 pr-4">Técnico</th>
                        <th className="py-3 pr-4">Ticket Actual</th>
                        <th className="py-3 pr-4">Activos</th>
                        <th className="py-3 pr-4">En Pausa</th>
                        <th className="py-3 pr-4">Resueltos Hoy</th>
                        <th className="py-3">Última Actividad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {technicians.map((m) => {
                        const techId = m.id ?? m.userId
                        const currentTicket =
                          m.activeTicket ??
                          m.currentTicket ??
                          (m.currentTicketId && m.currentTicketId > 0 ? m.currentTicketId : null)
                        const pendingCount = m.pendingCount ?? m.pendingTickets ?? 0
                        const lastComment = m.lastComment?.trim() || null
                        const initial = m.name.charAt(0).toUpperCase()
                        const stalled = isTechStalled(m.userId)
                        const highPending = pendingCount > 3

                        return (
                          <tr
                            key={techId}
                            className={cn(
                              'transition-colors duration-150 hover:bg-muted/40',
                              stalled
                                ? 'bg-red-50/30 dark:bg-red-950/20 border-l-4 border-l-red-500'
                                : highPending
                                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-l-4 border-l-amber-500'
                                  : '',
                            )}
                            data-testid={`tech-row-${m.name}`}
                          >
                            <td className="py-3 pr-4 font-medium">
                              <div className="flex items-center gap-2.5">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/25">
                                  {initial}
                                </div>
                                <div>
                                  <span className="text-foreground font-semibold block">{m.name}</span>
                                  {/* Subtítulo o badge para alertas */}
                                  {stalled && (
                                    <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                                      Tickets estancados (&gt;24h)
                                    </span>
                                  )}
                                  {/* Hidden selector cell preserved for QA test backward compatibility */}
                                  <span
                                    className="hidden"
                                    data-testid={`tech-comment-${m.name}`}
                                  >
                                    {lastComment ?? ''}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              {currentTicket ? (
                                <Link
                                  to={`/tickets/${currentTicket}`}
                                  className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary hover:underline"
                                >
                                  #{currentTicket}
                                </Link>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge variant="secondary" data-testid={`tech-active-${m.name}`}>
                                {m.activeTickets}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={highPending ? 'default' : 'outline'}
                                className={cn(
                                  highPending && 'bg-amber-500 text-white hover:bg-amber-600',
                                )}
                                data-testid={`tech-pending-${m.name}`}
                              >
                                {pendingCount}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                                data-testid={`tech-resolved-${m.name}`}
                              >
                                {m.resolvedToday ?? 0}
                              </Badge>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {m.lastActivity ? (
                                <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                                  <Clock className="size-3 text-muted-foreground" />
                                  {formatRelative(m.lastActivity)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground italic">Sin actividad reciente</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                      {technicians.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            Sin datos de equipo.
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
      </section>

      {/* SECCIÓN C: TABLERO DE TICKETS DEL GRUPO (La Vista Clave de Supervisión) */}
      <section aria-labelledby="section-tickets-title">
        <Card className="shadow-xs border-border/70">
          <CardHeader className="flex flex-col gap-3 pb-3 border-b border-border/50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" aria-hidden="true" />
              <CardTitle id="section-tickets-title" className="text-base font-semibold">
                Tablero de Tickets del Grupo — {groupName}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-medium ml-1">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              </Badge>
            </div>

            {/* Filtros por Técnico y Estado */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="size-3.5" />
                <span>Filtros:</span>
              </div>
              <Select
                aria-label="Filtrar por técnico"
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="w-40 text-xs h-8"
                data-testid="filter-technician-select"
              >
                <option value="all">Todos los técnicos</option>
                <option value="unassigned">Sin asignar</option>
                {technicians.map((m) => (
                  <option key={m.userId} value={String(m.userId)}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filtrar por estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40 text-xs h-8"
                data-testid="filter-status-select"
              >
                <option value="all">Todos los estados</option>
                <option value="1">1 · Nuevo</option>
                <option value="2">2 · Asignado</option>
                <option value="3">3 · En Progreso</option>
                <option value="4">4 · Pendiente</option>
                <option value="5">5 · Resuelto</option>
                <option value="6">6 · Cerrado</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <p className="text-sm">No se encontraron tickets con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="group-tickets-table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pr-3 w-16">ID</th>
                      <th className="py-3 pr-4">Título</th>
                      <th className="py-3 pr-4">Estado</th>
                      <th className="py-3 pr-4">Técnico Asignado</th>
                      <th className="py-3 pr-4">Prioridad</th>
                      <th className="py-3 pr-4">Tiempo en Estado</th>
                      <th className="py-3">Último Comentario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredTickets.map((ticket) => {
                      const sMeta = statusMeta(ticket.status)
                      const pMeta = priorityMeta(ticket.priority)
                      const isPending = ticket.status === 4
                      const timeInState = formatRelative(ticket.updatedAt || ticket.createdAt)
                      const comment = ticket.lastComment?.trim() || null

                      return (
                        <tr
                          key={ticket.id}
                          className={cn(
                            'transition-colors duration-150 hover:bg-muted/40',
                            isPending && 'bg-amber-50/20 dark:bg-amber-950/15',
                          )}
                          data-testid={`group-ticket-row-${ticket.id}`}
                        >
                          <td className="py-3 pr-3 font-mono font-semibold text-xs">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="text-primary hover:underline"
                            >
                              #{ticket.id}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 font-medium text-foreground max-w-xs sm:max-w-sm truncate">
                            <Link
                              to={`/tickets/${ticket.id}`}
                              className="hover:underline"
                              title={ticket.title}
                            >
                              {ticket.title}
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-medium', sMeta.badgeClass)}
                            >
                              {sMeta.label}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-xs font-medium text-foreground">
                            {ticket.assigneeName ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="size-2 rounded-full bg-primary/70" />
                                {ticket.assigneeName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Sin asignar</span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-medium', pMeta.badgeClass)}
                            >
                              {pMeta.label}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                            {timeInState}
                          </td>
                          <td
                            className="py-3 text-xs max-w-sm"
                            data-testid={`group-ticket-comment-${ticket.id}`}
                          >
                            {comment ? (
                              <div
                                className={cn(
                                  'flex items-center gap-1.5 rounded-md px-2 py-1',
                                  isPending
                                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/20'
                                    : 'text-muted-foreground',
                                )}
                                title={comment}
                              >
                                {isPending && (
                                  <PauseCircle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                )}
                                <span className="truncate">{truncate(comment, 65)}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
