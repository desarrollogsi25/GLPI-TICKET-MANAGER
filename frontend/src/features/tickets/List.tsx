import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { AlertTriangle, Inbox, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { EmptyState, ErrorState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PriorityBadge, StatusBadge } from '@/components/ui/status-badge'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useRole } from '@/hooks/useRole'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useServicesQuery } from '@/hooks/useServices'
import { useTicketsQuery } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { useUiStore } from '@/store/uiStore'

import { typeLabel } from './labels'
import { TechnicianFilter } from './TechnicianFilter'
import { TicketFiltersBar } from './TicketFiltersBar'
import { TicketFiltersSheet } from './TicketFiltersSheet'
import { TicketListCard } from './TicketListCard'
import { TicketTable } from './TicketTable'

const columns: ColumnDef<TicketSummary>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-mono text-xs font-semibold text-muted-foreground hover:text-primary"
      >
        #{row.original.id}
      </Link>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Título',
    cell: ({ row }) => (
      <div className="max-w-md">
        <Link
          to={`/tickets/${row.original.id}`}
          className="font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
          title={row.original.title}
        >
          {row.original.title}
        </Link>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.typeLabel || typeLabel(row.original.type)}
      </span>
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
    cell: ({ row }) => <StatusBadge status={row.original.status} size="sm" />,
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
    cell: ({ row }) => <PriorityBadge priority={row.original.priority} size="sm" />,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Actualizado',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
        {formatRelative(row.original.updatedAt)}
      </span>
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

const EMPTY_TICKETS: TicketSummary[] = []

export function List() {
  const [searchParams] = useSearchParams()
  const isMobile = useIsMobile()
  const { isTechnician, isRequester } = useRole()
  const serviceIdParam = searchParams.get('serviceId')
  const serviceId = serviceIdParam ? parseInt(serviceIdParam, 10) : null

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
  const [sorting, setSorting] = useState<SortingState>([])

  useEffect(() => {
    const s = searchParams.get('status') ?? 'all'
    const p = searchParams.get('priority') ?? 'all'
    const q = searchParams.get('q') ?? ''
    const sd = searchParams.get('startDate') ?? ''
    const ed = searchParams.get('endDate') ?? ''
    setStatusFilter(s)
    setPriorityFilter(p)
    setGlobalFilter(q)
    setStartDate(sd)
    setEndDate(ed)
  }, [searchParams])

  const isDateRangeInvalid = Boolean(startDate && endDate && startDate > endDate)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState(statusFilter)
  const [draftPriority, setDraftPriority] = useState(priorityFilter)
  const [draftStartDate, setDraftStartDate] = useState(startDate)
  const [draftEndDate, setDraftEndDate] = useState(endDate)

  const setSelectedAssigneeId = useUiStore((state) => state.setSelectedAssigneeId)
  const assigneeId = useSelectedAssignee()
  const { data: services } = useServicesQuery()
  const activeService = services?.find((s) => s.id === serviceId)
  const serviceName = activeService?.name ?? (serviceId ? `Servicio #${serviceId}` : '')

  const { data, isLoading, isError, error, refetch } = useTicketsQuery({
    serviceId: serviceId ?? undefined,
    assigneeId: serviceId ? null : assigneeId,
    startDate: isDateRangeInvalid ? null : (startDate || null),
    endDate: isDateRangeInvalid ? null : (endDate || null),
    enabled: !isDateRangeInvalid,
  })

  const navigate = useNavigate()

  const buildUrl = useCallback(
    (next: {
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
      const query = sp.toString()
      if (query === searchParams.toString()) return
      navigate(query ? `/tickets?${query}` : '/tickets', { replace: true })
    },
    [navigate, searchParams],
  )

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

  const handleStartDateChange = useCallback(
    (value: string) => {
      setStartDate(value)
      buildUrl({
        status: statusFilter,
        priority: priorityFilter,
        startDate: value,
        endDate,
        search: globalFilter,
        serviceId: serviceIdParam,
      })
    },
    [buildUrl, statusFilter, priorityFilter, endDate, globalFilter, serviceIdParam],
  )

  const handleEndDateChange = useCallback(
    (value: string) => {
      setEndDate(value)
      buildUrl({
        status: statusFilter,
        priority: priorityFilter,
        startDate,
        endDate: value,
        search: globalFilter,
        serviceId: serviceIdParam,
      })
    },
    [buildUrl, statusFilter, priorityFilter, startDate, globalFilter, serviceIdParam],
  )

  const handleClearFilters = () => {
    setSelectedAssigneeId(null)
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

  const tickets = data?.items ?? EMPTY_TICKETS

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters: useMemo(
        () => [
          ...(statusFilter !== 'all' ? [{ id: 'status', value: statusFilter }] : []),
          ...(priorityFilter !== 'all' ? [{ id: 'priority', value: priorityFilter }] : []),
        ],
        [statusFilter, priorityFilter],
      ),
    },
    onSortingChange: setSorting,
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

  const visibleTotal = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const rangeStart = visibleTotal === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = Math.min(visibleTotal, (pageIndex + 1) * pageSize)

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        title={isRequester ? 'Mis tickets' : 'Tickets'}
        description={
          serviceId
            ? `${visibleTotal} ticket(s) para el servicio ${serviceName || ''}.`
            : isRequester
              ? data
                ? `${visibleTotal} ticket(s) registrados por vos, incluidos los resueltos y cerrados.`
                : 'Tickets que abriste en GLPI'
              : isTechnician
                ? data
                  ? `${visibleTotal} ticket(s) asignados a vos.`
                  : 'Tus tickets asignados'
                : data
                  ? assigneeId != null
                    ? `${visibleTotal} ticket(s) para el técnico seleccionado.`
                    : `${visibleTotal} ticket(s) de todos los técnicos.`
                  : 'Listado de tickets'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: isRequester ? 'Mis tickets' : 'Tickets' }]}
        actions={serviceId == null && !isTechnician && !isRequester ? <TechnicianFilter /> : undefined}
      />

      {serviceId != null && (
        <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 text-xs border border-border w-fit shadow-xs">
          <span className="text-muted-foreground">
            Filtrando por: <strong className="text-foreground">{serviceName || 'Requerimiento'}</strong>
          </span>
          <button
            type="button"
            onClick={handleClearServiceFilter}
            className="ml-1 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            aria-label="Quitar filtro"
          >
            <X className="size-3" aria-hidden="true" />
            <span>Quitar</span>
          </button>
        </div>
      )}

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
          className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive font-medium"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span>La fecha de inicio no puede ser posterior a la fecha de fin.</span>
        </div>
      )}

      {isError ? (
        <ErrorState
          message={getApiErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <div className="hidden md:block">
            {!isMobile && (
              <TicketTable
                table={table}
                columns={columns}
                isLoading={isLoading}
                hasActiveFilters={activeFiltersCount > 0 || Boolean(globalFilter.trim())}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>

          <div className="md:hidden space-y-2.5">
            {isMobile &&
              (isLoading ? (
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
                <EmptyState
                  icon={Inbox}
                  title="No hay tickets que coincidan con los filtros"
                  description="Intenta cambiar o limpiar los filtros aplicados."
                  action={
                    activeFiltersCount > 0 || Boolean(globalFilter.trim()) ? (
                      <Button size="sm" variant="outline" onClick={handleClearFilters}>
                        Limpiar filtros
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TicketListCard key={row.original.id} ticket={row.original} />
                ))
              ))}
          </div>
        </>
      )}

      {/* Pagination Bar with Range & Page Size */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="tabular-nums">
            Mostrando <strong className="text-foreground">{rangeStart}–{rangeEnd}</strong> de{' '}
            <strong className="text-foreground">{visibleTotal}</strong> · Página {pageIndex + 1} de{' '}
            {Math.max(1, table.getPageCount())}
          </span>
          <label className="hidden sm:inline-flex items-center gap-1.5">
            <span>Filas:</span>
            <select
              aria-label="Tickets por página"
              value={pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground cursor-pointer"
            >
              {[15, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[38px] md:min-h-[32px] px-3 text-xs cursor-pointer"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-h-[38px] md:min-h-[32px] px-3 text-xs cursor-pointer"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
