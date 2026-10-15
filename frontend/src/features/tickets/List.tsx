import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useServicesQuery } from '@/hooks/useServices'
import { useTicketsQuery } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'

import { PageHeader } from '@/components/layout/PageHeader'
import { priorityMeta, statusMeta } from './labels'
import { TechnicianFilter } from './TechnicianFilter'
import { TicketFiltersBar } from './TicketFiltersBar'
import { TicketFiltersSheet } from './TicketFiltersSheet'
import { TicketListCard } from './TicketListCard'
import { TicketTable } from './TicketTable'

const columns: ColumnDef<TicketSummary>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => <span className="text-muted-foreground">#{row.original.id}</span>,
  },
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
      <Link to={`/tickets/${row.original.id}`} className="font-medium hover:underline">
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    filterFn: (row, columnId, filterValue) => {
      if (filterValue == null || filterValue === '' || filterValue === 'all') {
        return true
      }
      return String(row.getValue(columnId)) === String(filterValue)
    },
    cell: ({ row }) => {
      const status = statusMeta(row.original.status)
      return <Badge className={status.badgeClass}>{status.label}</Badge>
    },
  },
  {
    accessorKey: 'priority',
    header: 'Prioridad',
    filterFn: (row, columnId, filterValue) => {
      if (filterValue == null || filterValue === '' || filterValue === 'all') {
        return true
      }
      return String(row.getValue(columnId)) === String(filterValue)
    },
    cell: ({ row }) => {
      const priority = priorityMeta(row.original.priority)
      return <Badge className={priority.badgeClass}>{priority.label}</Badge>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Actualizado',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatRelative(row.original.updatedAt)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right">
        <Link
          to={`/tickets/${row.original.id}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          Ver
        </Link>
      </div>
    ),
  },
]

export function List() {
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()
  const serviceIdParam = searchParams.get('serviceId')
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : null

  // Sincronización de filtros con URL
  const initialSearch = searchParams.get('q') ?? ''
  const initialStatus = searchParams.get('status') ?? 'all'
  const initialPriority = searchParams.get('priority') ?? 'all'

  const [globalFilter, setGlobalFilter] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [priorityFilter, setPriorityFilter] = useState(initialPriority)

  // Draft filters para el Bottom Sheet móvil
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState(statusFilter)
  const [draftPriority, setDraftPriority] = useState(priorityFilter)

  const assigneeId = useSelectedAssignee()
  const { data: services } = useServicesQuery()
  const activeService = services?.find((s) => s.id === serviceId)
  const serviceName = activeService?.name ?? (serviceId ? `Servicio #${serviceId}` : '')

  const { data, isLoading, isError, error } = useTicketsQuery({
    serviceId: serviceId ?? undefined,
    assigneeId: serviceId ? null : assigneeId,
  })

  const navigate = useNavigate()

  const applyCombinedFilters = (newStatus: string, newPriority: string) => {
    setStatusFilter(newStatus)
    setPriorityFilter(newPriority)
    const sp = new URLSearchParams()
    if (newStatus && newStatus !== 'all') sp.set('status', newStatus)
    if (newPriority && newPriority !== 'all') sp.set('priority', newPriority)
    if (serviceIdParam) sp.set('serviceId', String(serviceIdParam))
    if (globalFilter.trim()) sp.set('q', globalFilter.trim())
    const searchStr = sp.toString() ? `?${sp.toString()}` : ''
    navigate(`/tickets${searchStr}`, { replace: true })
  }

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value)
    const sp = new URLSearchParams()
    if (statusFilter !== 'all') sp.set('status', statusFilter)
    if (priorityFilter !== 'all') sp.set('priority', priorityFilter)
    if (serviceIdParam) sp.set('serviceId', String(serviceIdParam))
    if (value.trim()) sp.set('q', value.trim())
    const searchStr = sp.toString() ? `?${sp.toString()}` : ''
    navigate(`/tickets${searchStr}`, { replace: true })
  }

  const handleStatusChange = (value: string) => {
    applyCombinedFilters(value, priorityFilter)
  }

  const handlePriorityChange = (value: string) => {
    applyCombinedFilters(statusFilter, value)
  }

  const handleClearServiceFilter = () => {
    const sp = new URLSearchParams()
    if (statusFilter !== 'all') sp.set('status', statusFilter)
    if (priorityFilter !== 'all') sp.set('priority', priorityFilter)
    if (globalFilter.trim()) sp.set('q', globalFilter.trim())
    const searchStr = sp.toString() ? `?${sp.toString()}` : ''
    navigate(`/tickets${searchStr}`, { replace: true })
  }

  const handleApplySheet = () => {
    applyCombinedFilters(draftStatus, draftPriority)
  }

  const handleResetSheet = () => {
    setDraftStatus('all')
    setDraftPriority('all')
    setStatusFilter('all')
    setPriorityFilter('all')
    const sp = new URLSearchParams()
    if (globalFilter.trim()) sp.set('q', globalFilter.trim())
    const searchStr = sp.toString() ? `?${sp.toString()}` : ''
    navigate(`/tickets${searchStr}`, { replace: true })
  }
  const handleOpenSheet = () => {
    setDraftStatus(statusFilter)
    setDraftPriority(priorityFilter)
    setIsSheetOpen(true)
  }

  const tickets = data?.items ?? []

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      globalFilter,
      columnFilters: useMemo(
        () => [
          ...(statusFilter !== 'all' ? [{ id: 'status', value: statusFilter }] : []),
          ...(priorityFilter !== 'all' ? [{ id: 'priority', value: priorityFilter }] : []),
        ],
        [statusFilter, priorityFilter],
      ),
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue).trim().toLowerCase()
      if (!term) return true
      return (
        String(row.original.id).includes(term) || row.original.title.toLowerCase().includes(term)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0) +
    (serviceId != null ? 1 : 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tickets"
        description={
          serviceId
            ? `${data?.total ?? 0} ticket(s) para el servicio ${serviceName || ''}.`
            : data
              ? `${data.total} ticket(s) para el técnico seleccionado.`
              : 'Listado de tickets'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Tickets' }]}
        actions={serviceId == null ? <TechnicianFilter /> : undefined}
      />

      {serviceId != null && (
        <div className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-1.5 text-sm border border-border w-fit">
          <span>
            Filtrando por: <strong>{serviceName || 'Requerimiento'}</strong>
          </span>
          <button
            type="button"
            onClick={handleClearServiceFilter}
            className="ml-2 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Quitar filtro"
          >
            Quitar
          </button>
        </div>
      )}

      {assigneeId == null && serviceId == null ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Selecciona un técnico o servicio para ver tickets.
        </p>
      ) : (
        <>
          {/* Barra de Filtros (Responsive: horizontal en desktop, input + botón sheet en móvil) */}
          <TicketFiltersBar
            search={globalFilter}
            onSearchChange={handleSearchChange}
            status={statusFilter}
            onStatusChange={handleStatusChange}
            priority={priorityFilter}
            onPriorityChange={handlePriorityChange}
            onOpenSheet={handleOpenSheet}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Bottom Sheet Móvil para Filtros */}
          <TicketFiltersSheet
            open={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            status={draftStatus}
            onStatusChange={setDraftStatus}
            priority={draftPriority}
            onPriorityChange={setDraftPriority}
            onApply={handleApplySheet}
            onReset={handleResetSheet}
            activeFiltersCount={activeFiltersCount}
          />

          {isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              {getApiErrorMessage(error)}
            </p>
          ) : (
            <>
              {/* Vista Desktop (md:+): Tabla TanStack completa */}
              <div className="hidden md:block">
                {!isMobile && <TicketTable table={table} columns={columns} isLoading={isLoading} />}
              </div>

              {/* Vista Móvil (<md): Lista Vertical de Cards */}
              <div className="md:hidden space-y-2.5">
                {isMobile && (
                  isLoading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={`card-skel-${index}`}
                        className="rounded-xl border border-border bg-card p-4 min-h-[88px] space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/6" />
                        </div>
                        <Skeleton className="h-5 w-4/5" />
                        <div className="flex justify-between items-center pt-1 border-t border-border/40">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </div>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8 text-center bg-card/40 my-2">
                      <span className="text-3xl mb-2">🎫</span>
                      <p className="text-sm font-semibold text-foreground">
                        No hay tickets que coincidan con los filtros
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                        Intenta cambiar o limpiar los filtros aplicados.
                      </p>
                    </div>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TicketListCard key={row.original.id} ticket={row.original} />
                    ))
                  )
                )}
              </div>
            </>
          )}

          {/* Paginación */}
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-xs md:text-sm text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="min-h-[38px] md:min-h-[32px] px-3 text-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[38px] md:min-h-[32px] px-3 text-xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
