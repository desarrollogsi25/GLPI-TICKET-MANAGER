import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSelectedAssignee } from '@/hooks/useSelectedAssignee'
import { useTicketsQuery } from '@/hooks/useTickets'
import { getApiErrorMessage } from '@/lib/api/errors'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'

import { CreateTicketDialog } from './CreateTicketDialog'
import { priorityMeta, statusMeta, TICKET_PRIORITIES, TICKET_STATUSES } from './labels'
import { TechnicianFilter } from './TechnicianFilter'

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
  const assigneeId = useSelectedAssignee()
  const { data, isLoading, isError, error } = useTicketsQuery(assigneeId)
  const [globalFilter, setGlobalFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const tickets = data?.items ?? []

  const table = useReactTable({
    data: tickets,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const term = String(filterValue).trim().toLowerCase()
      if (!term) {
        return true
      }
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

  const statusFilter = (table.getColumn('status')?.getFilterValue() as string | undefined) ?? 'all'
  const priorityFilter =
    (table.getColumn('priority')?.getFilterValue() as string | undefined) ?? 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `${data.total} ticket(s) para el técnico seleccionado.` : 'Listado de tickets'}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <TechnicianFilter />
          <Button onClick={() => setIsCreateOpen(true)}>Nuevo ticket</Button>
        </div>
      </div>

      {assigneeId == null ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
          Selecciona un técnico para ver sus tickets.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                className="w-56"
                placeholder="Título o #ID"
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="status-filter">Estado</Label>
              <Select
                id="status-filter"
                className="w-40"
                value={statusFilter}
                onChange={(event) => {
                  const value = event.target.value
                  table.getColumn('status')?.setFilterValue(value === 'all' ? undefined : value)
                }}
              >
                <option value="all">Todos</option>
                {TICKET_STATUSES.map((status) => (
                  <option key={status.value} value={String(status.value)}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="priority-filter">Prioridad</Label>
              <Select
                id="priority-filter"
                className="w-40"
                value={priorityFilter}
                onChange={(event) => {
                  const value = event.target.value
                  table.getColumn('priority')?.setFilterValue(value === 'all' ? undefined : value)
                }}
              >
                <option value="all">Todas</option>
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority.value} value={String(priority.value)}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {isError ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
              {getApiErrorMessage(error)}
            </p>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell colSpan={columns.length}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                        No hay tickets que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <CreateTicketDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  )
}
