import { useMemo, useState } from 'react'
import { CheckCircle2, Clock, ExternalLink, Search, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityBadge } from '@/components/ui/status-badge'
import {
  impactLabel,
  priorityMeta,
  TICKET_PRIORITIES,
  typeLabel,
  urgencyLabel,
} from '@/features/tickets/labels'
import { useRole } from '@/hooks/useRole'
import {
  useClaimTicketMutation,
  useGroupQueueQuery,
  useGroupsQuery,
} from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

function GroupQueueRow({
  ticket,
  groupName,
  onClaim,
  pending,
}: {
  ticket: TicketSummary
  groupName?: string
  onClaim: (id: number) => void
  pending: boolean
}) {
  const priority = priorityMeta(ticket.priority)
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border border-l-[3px] bg-card p-4 shadow-xs transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between',
        priority.stripeClass,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/tickets/${ticket.id}`}
            className="font-mono text-xs font-semibold text-muted-foreground hover:text-primary shrink-0"
          >
            #{ticket.id}
          </Link>
          <Link
            to={`/tickets/${ticket.id}`}
            className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
            title={ticket.title}
          >
            {ticket.title}
          </Link>
          {groupName ? (
            <span className="rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-[11px] font-medium text-foreground">
              {groupName}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <PriorityBadge priority={ticket.priority} size="sm" />
          <span className="rounded border border-border/80 bg-background px-1.5 py-0.5 text-[11px]">
            {ticket.typeLabel || typeLabel(ticket.type)}
          </span>
          <span>
            Urgencia {urgencyLabel(ticket.urgency)} · Impacto {impactLabel(ticket.impact)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            {formatRelative(ticket.createdAt)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          to={`/tickets/${ticket.id}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          aria-label={`Ver detalle del ticket #${ticket.id}`}
        >
          <span>Ver</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </Link>
        <Button
          size="sm"
          loading={pending}
          onClick={() => onClaim(ticket.id)}
          disabled={pending}
          className="min-w-[105px] cursor-pointer"
        >
          {pending ? 'Asignando…' : 'Asignarme'}
        </Button>
      </div>
    </div>
  )
}

export function GroupQueuePage() {
  const toast = useToastStore((state) => state.push)
  const groups = useGroupsQuery()
  const { isTechnician } = useRole()
  const [searchParams] = useSearchParams()
  const paramGroupId = searchParams.get('groupId') ? Number(searchParams.get('groupId')) : null
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [claimingTicketId, setClaimingTicketId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const effectiveGroupId =
    selectedGroupId ?? paramGroupId ?? (groups.data && groups.data.length > 0 ? groups.data[0].id : null)

  const effectiveGroup = groups.data?.find((g) => g.id === effectiveGroupId)

  const queue = useGroupQueueQuery(effectiveGroupId)
  const claim = useClaimTicketMutation()

  const items = useMemo(() => queue.data?.items ?? [], [queue.data?.items])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    return items.filter((t) => {
      if (priorityFilter !== 'all' && String(t.priority) !== priorityFilter) {
        return false
      }
      if (term) {
        return String(t.id).includes(term) || t.title.toLowerCase().includes(term)
      }
      return true
    })
  }, [items, search, priorityFilter])

  const hasFilters = Boolean(search.trim()) || priorityFilter !== 'all'

  const handleClaim = (ticketId: number) => {
    setClaimingTicketId(ticketId)
    claim.mutate(ticketId, {
      onSuccess: () => {
        setClaimingTicketId(null)
        toast({
          title: 'Ticket asignado correctamente',
          description: `Te has asignado el ticket #${ticketId}`,
          variant: 'success',
        })
      },
      onError: (err) => {
        setClaimingTicketId(null)
        toast({
          title: 'No se pudo asignar el ticket',
          description: getApiErrorMessage(err),
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title="Cola de mi grupo"
        description={`Tickets sin técnico asignado disponibles para tomar${items.length > 0 ? ` · ${items.length} en cola` : ''}.`}
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Cola' }]}
        actions={
          isTechnician ? (
            effectiveGroup ? (
              <span
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-xs"
                data-testid="technician-group-label"
              >
                Grupo: {effectiveGroup.name}
              </span>
            ) : undefined
          ) : groups.data && groups.data.length > 1 ? (
            <Select
              aria-label="Seleccionar grupo de soporte"
              value={effectiveGroupId ? String(effectiveGroupId) : undefined}
              onChange={(e) => setSelectedGroupId(Number(e.target.value))}
              className="w-56"
            >
              {groups.data.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {/* Contextual Filter Toolbar */}
      {!groups.isLoading && !queue.isLoading && items.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en la cola por título o #ID…"
              aria-label="Buscar en la cola del grupo"
              className="pl-9 pr-8 h-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <DropdownSelect
            aria-label="Filtrar cola por prioridad"
            value={priorityFilter}
            onChange={setPriorityFilter}
            className="w-full sm:w-52"
            options={[
              { value: 'all', label: 'Todas las prioridades' },
              ...TICKET_PRIORITIES.map((p) => ({ value: String(p.value), label: p.label })),
            ]}
          />

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setPriorityFilter('all')
              }}
              className="shrink-0 gap-1 text-xs"
            >
              <X className="size-3.5" aria-hidden="true" />
              Limpiar
            </Button>
          )}
        </div>
      )}

      {groups.isLoading || queue.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : groups.isError || queue.isError ? (
        <ErrorState
          message={getApiErrorMessage(groups.error ?? queue.error)}
          onRetry={() => {
            void groups.refetch()
            void queue.refetch()
          }}
        />
      ) : filteredItems.length > 0 ? (
        <div className="space-y-2.5">
          {filteredItems.map((ticket) => (
            <GroupQueueRow
              key={ticket.id}
              ticket={ticket}
              groupName={effectiveGroup?.name}
              onClaim={handleClaim}
              pending={claimingTicketId === ticket.id}
            />
          ))}
        </div>
      ) : hasFilters ? (
        <EmptyState
          icon={Search}
          title="Sin coincidencias en la cola"
          description="Ningún ticket sin asignar coincide con la búsqueda o prioridad seleccionada."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch('')
                setPriorityFilter('all')
              }}
            >
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={CheckCircle2}
          title="No hay tickets sin asignar en tu grupo."
          description="Todos los tickets entrantes ya cuentan con un técnico responsable."
        />
      )}
    </div>
  )
}
