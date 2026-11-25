import { flexRender, type ColumnDef, type Table as ReactTableType } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface TicketTableProps {
  table: ReactTableType<TicketSummary>
  columns: ColumnDef<TicketSummary>[]
  isLoading?: boolean
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export function TicketTable({
  table,
  columns,
  isLoading,
  onClearFilters,
  hasActiveFilters = false,
}: TicketTableProps) {
  return (
    <Card className="overflow-hidden border-border shadow-xs">
      <Table>
        <TableHeader className="bg-surface-subtle">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={
                      sorted === 'asc'
                        ? 'ascending'
                        : sorted === 'desc'
                          ? 'descending'
                          : canSort
                            ? 'none'
                            : undefined
                    }
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3.5 text-primary" aria-hidden="true" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3.5 text-primary" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={columns.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-6">
                <EmptyState
                  icon={Inbox}
                  compact
                  title="No hay tickets que coincidan con los filtros."
                  description={
                    hasActiveFilters
                      ? 'Prueba ajustar la búsqueda, el estado o el rango de fechas.'
                      : 'Cuando se registren tickets en tu alcance aparecerán aquí.'
                  }
                  action={
                    hasActiveFilters && onClearFilters ? (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Restablecer filtros
                      </button>
                    ) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const isClosed = row.original.status === 6
              return (
                <TableRow
                  key={row.id}
                  className={cn(isClosed && 'opacity-75 hover:opacity-100')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </Card>
  )
}
