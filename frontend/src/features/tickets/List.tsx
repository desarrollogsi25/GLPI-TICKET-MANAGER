import { motion } from 'motion/react'
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
import { useRole } from '@/hooks/useRole'
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
    header: () => <span className="sr-only">Acciones</span>,
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
  const { isTechnician } = useRole()
  const serviceIdParam = searchParams.get('serviceId')
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : null

  // Sincronización de filtros con URL
  const initialSearch = searchParams.get('q') ?? ''
  const initialStatus = searchParams.get('status') ?? 'all'
  const initialPriority = searchParams.get('priority') ?? 'all'
  const initialStartDate = searchParams.get('startDate') ?? ''
  const initialEndDate = searchParams.get('endDate') ?? ''

  const [globalFilter, setGlobalFilter] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const [priorityFilter, setPriorityFilter] = useState(initialPriority)
  const [startDate, setStartDate] = useState(initialStartDate)
  const [endDate, setEndDate] = useState(initialEndDate)

  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate)

  // Draft filters para el Bottom Sheet móvil
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState(statusFilter)
  const [draftPriority, setDraftPriority] = useState(priorityFilter)
  const [draftStartDate, setDraftStartDate] = useState(startDate)
  const [draftEndDate, setDraftEndDate] = useState(endDate)

  const assigneeId = useSelectedAssignee()
  const { data: services } = useServicesQuery()
  const activeService = services?.find((s) => s.id === serviceId)
  const serviceName = activeService?.name ?? (serviceId ? `Servicio #${serviceId}` : '')

  const { data, isLoading, isError, error } = useTicketsQuery({
    serviceId: serviceId ?? undefined,
    assigneeId: serviceId ? null : assigneeId,
    startDate: isDateRangeInvalid ? null : (startDate || null),
    endDate: isDateRangeInvalid ? null : (endDate || null),
    enabled: !isDateRangeInvalid,
  })

  const navigate = useNavigate()

  /** Rebuilds the /tickets URL from a filter snapshot, so every filter stays shareable. */
  const buildUrl = (next: {
    status: string
    priority: string
    startDate: string
    endDate: string
    search: string
    serviceId?: string | null
  }) => {
    const sp = new URLSearchParams()
    if (next.status && next.status !== 'all') sp.set('status', next.status)
    if (next.priority && next.priority !== 'all') sp.set('priority', next.priority)
    if (next.startDate) sp.set('startDate', next.startDate)
    if (next.endDate) sp.set('endDate', next.endDate)
    if (next.serviceId) sp.set('serviceId', String(next.serviceId))
    if (next.search.trim()) sp.set('q', next.search.trim())
    const searchStr = sp.toString() ? `?${sp.toString()}` : ''
    navigate(`/tickets${searchStr}`, { replace: true })
  }

  const applyCombinedFilters = (newStatus: string, newPriority: string) => {
    setStatusFilter(newStatus)
    setPriorityFilter(newPriority)
    buildUrl({
      status: newStatus,
      priority: newPriority,
      startDate,
      endDate,
      search: globalFilter,
      serviceId: serviceIdParam,
    })
  }

  const handleSearchChange = (value: string) => {
    setGlobalFilter(value)
    buildUrl({
      status: statusFilter,
      priority: priorityFilter,
      startDate,
      endDate,
      search: value,
      serviceId: serviceIdParam,
    })
  }

  const handleStatusChange = (value: string) => {
    applyCombinedFilters(value, priorityFilter)
  }

  const handlePriorityChange = (value: string) => {
    applyCombinedFilters(statusFilter, value)
  }

  const handleStartDateChange = (value: string) => {
    setStartDate(value)
    buildUrl({
      status: statusFilter,
      priority: priorityFilter,
      startDate: value,
      endDate,
      search: globalFilter,
      serviceId: serviceIdParam,
    })
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    buildUrl({
      status: statusFilter,
      priority: priorityFilter,
      startDate,
      endDate: value,
      search: globalFilter,
      serviceId: serviceIdParam,
    })
  }

  /** Clears every filter (status, priority, dates and search) back to the default view. */
  const handleClearFilters = () => {
    setStatusFilter('all')
    setPriorityFilter('all')
    setStartDate('')
    setEndDate('')
    setGlobalFilter('')
    setDraftStatus('all')
    setDraftPriority('all')
    setDraftStartDate('')
    setDraftEndDate('')
    navigate('/tickets', { replace: true })
  }

  const handleClearServiceFilter = () => {
    buildUrl({
      status: statusFilter,
      priority: priorityFilter,
      startDate,
      endDate,
      search: globalFilter,
      serviceId: null,
    })
  }

  const handleApplySheet = () => {
    setStatusFilter(draftStatus)
    setPriorityFilter(draftPriority)
    setStartDate(draftStartDate)
    setEndDate(draftEndDate)
    buildUrl({
      status: draftStatus,
      priority: draftPriority,
      startDate: draftStartDate,
      endDate: draftEndDate,
      search: globalFilter,
      serviceId: serviceIdParam,
    })
  }

  const handleResetSheet = () => {
    setDraftStatus('all')
    setDraftPriority('all')
    setDraftStartDate('')
    setDraftEndDate('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setStartDate('')
    setEndDate('')
    buildUrl({
      status: 'all',
      priority: 'all',
      startDate: '',
      endDate: '',
      search: globalFilter,
      serviceId: serviceIdParam,
    })
  }
  const handleOpenSheet = () => {
    setDraftStatus(statusFilter)
    setDraftPriority(priorityFilter)
    setDraftStartDate(startDate)
    setDraftEndDate(endDate)
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
    (serviceId != null ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tickets"
        description={
          serviceId
            ? `${data?.total ?? 0} ticket(s) para el servicio ${serviceName || ''}.`
            : isTechnician
              ? data
                ? `${data.total} ticket(s) asignados a vos.`
                : 'Tus tickets asignados'
              : data
                ? `${data.total} ticket(s) para el técnico seleccionado.`
                : 'Listado de tickets'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Tickets' }]}
        actions={serviceId == null && !isTechnician ? <TechnicianFilter /> : undefined}
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
          {isTechnician
            ? 'No hay tickets asignados a tu usuario.'
            : 'Selecciona un técnico o servicio para ver tickets.'}
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
            startDate={startDate}
            onStartDateChange={handleStartDateChange}
            endDate={endDate}
            onEndDateChange={handleEndDateChange}
            onClearFilters={handleClearFilters}
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
            startDate={draftStartDate}
            onStartDateChange={setDraftStartDate}
            endDate={draftEndDate}
            onEndDateChange={setDraftEndDate}
            onApply={handleApplySheet}
            onReset={handleResetSheet}
            activeFiltersCount={activeFiltersCount}
          />

          {isDateRangeInvalid && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive font-medium"
            >
              <span aria-hidden="true">⚠️</span>
              <span>La fecha de inicio no puede ser posterior a la fecha de fin.</span>
            </div>
          )}

          {isError ? (
            <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <span>{getApiErrorMessage(error)}</span>
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
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
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 p-8 text-center bg-card/40 my-2"
                    >
                      <span className="text-3xl mb-2">🎫</span>
                      <p className="text-sm font-semibold text-foreground">
                        No hay tickets que coincidan con los filtros
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                        Intenta cambiar o limpiar los filtros aplicados.
                      </p>
                    </motion.div>
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
