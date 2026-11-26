import { AlertTriangle, Building2, CheckCircle2, Clock, Layers, RefreshCw, Users } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAdminDashboardQuery,
  useAdminWatcherStatusQuery,
  useRecoverWatcherTicketMutation,
} from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useToastStore } from '@/store/toastStore'

/**
 * Admin view: "Administración" — global overview of all groups and GLPI watcher integrity.
 */
export function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useAdminDashboardQuery()
  const {
    data: watcherStatus,
    isError: watcherIsError,
    error: watcherError,
    refetch: refetchWatcher,
  } = useAdminWatcherStatusQuery()
  const recoverMutation = useRecoverWatcherTicketMutation()
  const pushToast = useToastStore((state) => state.push)
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
      iconClass: 'text-foreground bg-muted',
    },
    {
      id: 'tickets',
      label: 'Tickets totales',
      value: totalTickets,
      icon: Layers,
      iconClass: 'text-blue-700 dark:text-blue-300 bg-blue-500/12',
    },
    {
      id: 'pending',
      label: 'En espera (Pendientes)',
      value: totalPending,
      icon: Clock,
      iconClass: 'text-amber-700 dark:text-amber-300 bg-amber-500/15',
    },
    {
      id: 'techs',
      label: 'Técnicos asignados',
      value: totalTechs,
      icon: Users,
      iconClass: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15',
    },
  ]

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Administración"
        description="Supervisión global de grupos de soporte e integridad del sincronizador nativo GLPI."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Administración' }]}
      />

      <div
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        data-testid="admin-kpi-cards"
      >
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.id} className="shadow-xs border-border">
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
                  <p className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                    <NumberTicker value={kpi.value} />
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="shadow-xs border-border">
        <CardHeader className="pb-3 border-b border-border/70">
          <CardTitle className="text-sm font-semibold">Resumen por grupo</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : isError ? (
            <ErrorState
              message="Error al cargar el resumen de administración."
              onRetry={() => void refetch()}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:hidden" data-testid="admin-mobile-cards">
                {groups.map((g) => (
                  <div
                    key={g.groupId}
                    className="rounded-xl border border-border bg-surface-subtle/50 p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{g.groupName}</span>
                      <Badge variant="secondary">{g.activeTechnicians} técnicos</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-card p-2 border border-border">
                        <span className="text-muted-foreground">Tickets totales: </span>
                        <span className="font-bold tabular-nums">{g.totalTickets}</span>
                      </div>
                      <div className="rounded-lg bg-card p-2 border border-border">
                        <span className="text-muted-foreground">Pendientes: </span>
                        <span className="font-bold tabular-nums text-amber-700 dark:text-amber-300">
                          {g.pendingTickets}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm" data-testid="admin-groups-table">
                  <thead className="bg-surface-subtle">
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5 px-3">Grupo</th>
                      <th className="py-2.5 px-3">Tickets totales</th>
                      <th className="py-2.5 px-3">Pendientes</th>
                      <th className="py-2.5 px-3">Técnicos activos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {groups.map((g) => (
                      <tr key={g.groupId} className="transition-colors duration-150 hover:bg-muted/40">
                        <td className="py-3 px-3 font-semibold text-foreground">{g.groupName}</td>
                        <td className="py-3 px-3">
                          <Badge variant="secondary" className="tabular-nums">
                            {g.totalTickets}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="tabular-nums">
                            {g.pendingTickets}
                          </Badge>
                        </td>
                        <td className="py-3 px-3">
                          <Badge className="bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 tabular-nums">
                            {g.activeTechnicians}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {groups.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6">
                          <EmptyState icon={Building2} compact title="Sin datos de grupos." />
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

      {watcherIsError && (
        <ErrorState
          title="No se pudo consultar el estado del Watcher GLPI"
          message={getApiErrorMessage(watcherError)}
          onRetry={() => void refetchWatcher()}
        />
      )}

      {watcherStatus && (
        <Card
          className={`shadow-xs ${
            watcherStatus.hasOperationalAlert
              ? 'border-destructive/60 bg-destructive/5'
              : 'border-border'
          }`}
          data-testid="admin-watcher-status-card"
        >
          <CardHeader className="pb-3 border-b border-border/70 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {watcherStatus.hasOperationalAlert ? (
                <AlertTriangle className="size-4 text-destructive shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              )}
              <CardTitle className="text-sm font-semibold">
                Estado operativo del Watcher GLPI
              </CardTitle>
            </div>
            <Badge
              variant={watcherStatus.hasOperationalAlert ? 'destructive' : 'secondary'}
              data-testid="watcher-alert-badge"
            >
              {watcherStatus.hasOperationalAlert
                ? `${watcherStatus.permanentlyFailedCount} fallo(s) permanente(s)`
                : 'Operativo'}
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg bg-surface-subtle p-3 border border-border">
                <span className="text-muted-foreground block">Cursor actual (Ticket ID)</span>
                <span
                  className="mt-1 text-base font-semibold font-mono tabular-nums block text-foreground"
                  data-testid="watcher-checkpoint-value"
                >
                  {watcherStatus.lastSeenTicketId ?? 'No inicializado'}
                </span>
              </div>
              <div className="rounded-lg bg-surface-subtle p-3 border border-border">
                <span className="text-muted-foreground block">Pendientes de reconciliación</span>
                <span
                  className="mt-1 text-base font-semibold tabular-nums block text-foreground"
                  data-testid="watcher-pending-count"
                >
                  {watcherStatus.pendingCount}
                </span>
              </div>
              <div className="rounded-lg bg-surface-subtle p-3 border border-border">
                <span className="text-muted-foreground block">Fallos permanentes (50+ intentos)</span>
                <span
                  className={`mt-1 text-base font-semibold tabular-nums block ${
                    watcherStatus.permanentlyFailedCount > 0 ? 'text-destructive' : 'text-foreground'
                  }`}
                  data-testid="watcher-failed-count"
                >
                  {watcherStatus.permanentlyFailedCount}
                </span>
              </div>
            </div>

            {watcherStatus.permanentlyFailedTickets.length > 0 && (
              <div className="space-y-2" data-testid="watcher-permanently-failed-list">
                <p className="text-xs font-semibold text-destructive">
                  Alerta operativa: Los siguientes tickets agotaron el límite de reintentos y requieren revisión o recuperación explícita
                  {watcherStatus.permanentlyFailedTicketsTruncated
                    ? ` (mostrando primeros ${watcherStatus.permanentlyFailedTickets.length} de ${watcherStatus.permanentlyFailedCount})`
                    : ':'}
                </p>
                <div className="space-y-2">
                  {watcherStatus.permanentlyFailedTickets.map((item) => (
                    <div
                      key={item.ticketId}
                      data-testid={`watcher-failed-ticket-${item.ticketId}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-card p-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-foreground truncate">
                          Ticket #{item.ticketId} — {item.ticketName}
                        </div>
                        <div className="text-muted-foreground">
                          Intentos: {item.attempts} · Estado: {item.status}
                          {item.lastError ? ` · Detalle: ${item.lastError}` : ''}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`watcher-recover-btn-${item.ticketId}`}
                        loading={recoverMutation.isPending}
                        disabled={recoverMutation.isPending}
                        onClick={() =>
                          recoverMutation.mutate(item.ticketId, {
                            onSuccess: () => {
                              pushToast({
                                title: 'Recuperación encolada',
                                description: `El ticket #${item.ticketId} fue reencolado para reconciliación en GLPI.`,
                                variant: 'success',
                              })
                            },
                            onError: (err) => {
                              pushToast({
                                title: 'No se pudo recuperar el ticket',
                                description: getApiErrorMessage(err),
                                variant: 'destructive',
                              })
                            },
                          })
                        }
                        className="shrink-0 gap-1.5"
                      >
                        <RefreshCw className="size-3.5" aria-hidden="true" />
                        Recuperar ticket
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
