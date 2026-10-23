import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Archive,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  MessageSquare,
  Plus,
  UserCheck,
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
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useGroupsQuery, useTeamDashboardQuery } from '@/hooks/useTickets'
import { cn } from '@/lib/utils'

/**
 * Supervisor view: "Mi Equipo" — live status cards with NumberTicker and
 * responsive technician table + mobile cards (H-40 / H-41 / H-42).
 */
export function TeamDashboard() {
  const groups = useGroupsQuery()
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

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

  const statCards = [
    {
      id: 'total',
      label: 'Total tickets',
      value: summary?.total ?? data?.totalTickets ?? 0,
      icon: Layers,
      iconColor: 'text-slate-600 dark:text-slate-300 bg-slate-500/10',
      accent:
        'border-border/70 bg-card hover:border-slate-400/50 transition-colors duration-150',
    },
    {
      id: 'queued',
      label: 'En cola',
      value: summary?.queued ?? data?.queuedTickets ?? 0,
      icon: Inbox,
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
      accent:
        'border-blue-500/25 bg-blue-50/40 dark:bg-blue-950/30 hover:border-blue-500/50 transition-colors duration-150',
    },
    {
      id: 'assigned',
      label: 'Asignados',
      value: summary?.assigned ?? data?.assignedTickets ?? 0,
      icon: UserCheck,
      iconColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10',
      accent:
        'border-sky-500/25 bg-sky-50/40 dark:bg-sky-950/30 hover:border-sky-500/50 transition-colors duration-150',
    },
    {
      id: 'in-progress',
      label: 'En progreso',
      value: summary?.inProgress ?? data?.inProgressTickets ?? 0,
      icon: Activity,
      iconColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
      accent:
        'border-indigo-500/25 bg-indigo-50/40 dark:bg-indigo-950/30 hover:border-indigo-500/50 transition-colors duration-150',
    },
    {
      id: 'pending',
      label: 'Pendientes',
      value: summary?.pending ?? data?.pendingTickets ?? 0,
      icon: Clock,
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
      accent:
        'border-amber-500/25 bg-amber-50/40 dark:bg-amber-950/30 hover:border-amber-500/50 transition-colors duration-150',
    },
    {
      id: 'resolved',
      label: 'Resueltos',
      value: summary?.resolved ?? data?.resolvedTickets ?? 0,
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
      accent:
        'border-emerald-500/25 bg-emerald-50/40 dark:bg-emerald-950/30 hover:border-emerald-500/50 transition-colors duration-150',
    },
    {
      id: 'closed',
      label: 'Cerrados',
      value: summary?.closed ?? data?.closedTickets ?? 0,
      icon: Archive,
      iconColor: 'text-teal-600 dark:text-teal-400 bg-teal-500/10',
      accent:
        'border-teal-500/25 bg-teal-50/40 dark:bg-teal-950/30 hover:border-teal-500/50 transition-colors duration-150',
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mi Equipo"
        description={`Vista en vivo del equipo de soporte (${groupName}).`}
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

      {/* Tarjetas de totales por estado con NumberTicker */}
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"
        data-testid="team-status-cards"
      >
        {statCards.map((card) => {
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
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    <NumberTicker value={card.value} />
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Tabla detallada de técnicos (Desktop) + Cards apiladas (Móvil) */}
      <Card className="shadow-xs border-border/70">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" aria-hidden="true" />
            <CardTitle className="text-base font-semibold">Técnicos — {groupName}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {technicians.length} {technicians.length === 1 ? 'miembro' : 'miembros'}
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
                  const queuedCount = m.queuedCount ?? summary?.queued ?? data?.queuedTickets ?? 0
                  const pendingCount = m.pendingCount ?? m.pendingTickets ?? 0
                  const lastComment = m.lastComment?.trim() || null
                  const initial = m.name.charAt(0).toUpperCase()

                  return (
                    <div
                      key={techId}
                      data-testid={`tech-mobile-card-${m.name}`}
                      className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/25">
                            {initial}
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate">
                            {m.name}
                          </span>
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
                          <p className="text-[10px] text-muted-foreground uppercase">En Cola</p>
                          <p className="text-sm font-bold tabular-nums mt-0.5">{queuedCount}</p>
                        </div>
                        <div className="rounded-lg bg-background/80 border border-border/50 p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Pendientes</p>
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

              {/* Tabla detallada (siempre en el DOM con hidden md:block para desktop y accesible para tests) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" data-testid="team-technicians-table">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 pr-4">Técnico</th>
                      <th className="py-3 pr-4">Ticket Actual</th>
                      <th className="py-3 pr-4">En Cola</th>
                      <th className="py-3 pr-4">Pendientes</th>
                      <th className="py-3 pr-4">Resueltos Hoy</th>
                      <th className="py-3">Último Comentario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {technicians.map((m) => {
                      const techId = m.id ?? m.userId
                      const currentTicket =
                        m.activeTicket ??
                        m.currentTicket ??
                        (m.currentTicketId && m.currentTicketId > 0 ? m.currentTicketId : null)
                      const queuedCount =
                        m.queuedCount ?? summary?.queued ?? data?.queuedTickets ?? 0
                      const pendingCount = m.pendingCount ?? m.pendingTickets ?? 0
                      const lastComment = m.lastComment?.trim() || null
                      const initial = m.name.charAt(0).toUpperCase()

                      return (
                        <tr
                          key={techId}
                          className="transition-colors duration-150 hover:bg-muted/40"
                          data-testid={`tech-row-${m.name}`}
                        >
                          <td className="py-3 pr-4 font-medium">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/25">
                                {initial}
                              </div>
                              <span className="text-foreground font-semibold">{m.name}</span>
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
                            <Badge variant="secondary" data-testid={`tech-queued-${m.name}`}>
                              {queuedCount}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant="outline" data-testid={`tech-pending-${m.name}`}>
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
                          <td
                            className="py-3 max-w-xs truncate text-xs text-muted-foreground"
                            title={lastComment ?? undefined}
                            data-testid={`tech-comment-${m.name}`}
                          >
                            {lastComment ? (
                              <span className="text-foreground">{lastComment}</span>
                            ) : (
                              <span>—</span>
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

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
