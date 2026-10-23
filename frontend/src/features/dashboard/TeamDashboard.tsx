import { useState } from 'react'
import { Link } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateTicketDialog } from '@/features/tickets/CreateTicketDialog'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useGroupsQuery, useTeamDashboardQuery } from '@/hooks/useTickets'

/**
 * Supervisor view: "Mi Equipo" — live status cards and detailed technician table.
 * Consumes GET /api/groups/{groupId}/dashboard and subscribes to SignalR for real-time updates (H-40 / H-41).
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
      accent: 'border-slate-200 bg-slate-50/70 text-slate-900 dark:bg-slate-900/50 dark:text-slate-100',
    },
    {
      id: 'queued',
      label: 'En cola',
      value: summary?.queued ?? data?.queuedTickets ?? 0,
      accent: 'border-blue-200 bg-blue-50/70 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200',
    },
    {
      id: 'assigned',
      label: 'Asignados',
      value: summary?.assigned ?? data?.assignedTickets ?? 0,
      accent: 'border-sky-200 bg-sky-50/70 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200',
    },
    {
      id: 'in-progress',
      label: 'En progreso',
      value: summary?.inProgress ?? data?.inProgressTickets ?? 0,
      accent: 'border-indigo-200 bg-indigo-50/70 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200',
    },
    {
      id: 'pending',
      label: 'Pendientes',
      value: summary?.pending ?? data?.pendingTickets ?? 0,
      accent: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    },
    {
      id: 'resolved',
      label: 'Resueltos',
      value: summary?.resolved ?? data?.resolvedTickets ?? 0,
      accent: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
    },
    {
      id: 'closed',
      label: 'Cerrados',
      value: summary?.closed ?? data?.closedTickets ?? 0,
      accent: 'border-teal-200 bg-teal-50/70 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200',
    },
  ]

  return (
    <div className="space-y-4">
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
                className="w-48"
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
            >
              + Crear ticket
            </Button>
          </div>
        }
      />

      {/* Tarjetas de totales por estado */}
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
        data-testid="team-status-cards"
      >
        {statCards.map((card) => (
          <Card key={card.id} className={card.accent} data-testid={`team-card-${card.id}`}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-12" />
              ) : (
                <p className="mt-1 text-2xl font-bold tracking-tight">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla detallada de técnicos (H-41: Técnico | Ticket Actual | En Cola | Pendientes | Resueltos Hoy | Último Comentario) */}
      <Card>
        <CardHeader>
          <CardTitle>Técnicos — {groupName}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">Error al cargar el dashboard del equipo.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="team-technicians-table">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2.5 pr-4">Técnico</th>
                    <th className="py-2.5 pr-4">Ticket Actual</th>
                    <th className="py-2.5 pr-4">En Cola</th>
                    <th className="py-2.5 pr-4">Pendientes</th>
                    <th className="py-2.5 pr-4">Resueltos Hoy</th>
                    <th className="py-2.5">Último Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {technicians.map((m) => {
                    const techId = m.id ?? m.userId
                    const currentTicket =
                      m.activeTicket ??
                      m.currentTicket ??
                      (m.currentTicketId && m.currentTicketId > 0 ? m.currentTicketId : null)
                    const queuedCount = m.queuedCount ?? summary?.queued ?? data?.queuedTickets ?? 0
                    const pendingCount = m.pendingCount ?? m.pendingTickets ?? 0
                    const lastComment = m.lastComment?.trim() || null

                    return (
                      <tr key={techId} className="border-b border-border/50" data-testid={`tech-row-${m.name}`}>
                        <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                        <td className="py-2.5 pr-4">
                          {currentTicket ? (
                            <Link
                              to={`/tickets/${currentTicket}`}
                              className="font-mono text-xs font-semibold text-primary hover:underline"
                            >
                              #{currentTicket}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="secondary" data-testid={`tech-queued-${m.name}`}>
                            {queuedCount}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" data-testid={`tech-pending-${m.name}`}>
                            {pendingCount}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge
                            className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            data-testid={`tech-resolved-${m.name}`}
                          >
                            {m.resolvedToday ?? 0}
                          </Badge>
                        </td>
                        <td
                          className="py-2.5 max-w-xs truncate text-xs text-muted-foreground"
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
                      <td colSpan={6} className="py-4 text-center text-muted-foreground">
                        Sin datos de equipo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTicketDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
