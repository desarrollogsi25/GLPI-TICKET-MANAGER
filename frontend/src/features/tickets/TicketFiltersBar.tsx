import { Search, SlidersHorizontal, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { DropdownSelect } from '@/components/ui/dropdown-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { TICKET_PRIORITIES, TICKET_STATUSES } from './labels'

interface TicketFiltersBarProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  priority: string
  onPriorityChange: (value: string) => void
  startDate: string
  onStartDateChange: (value: string) => void
  endDate: string
  onEndDateChange: (value: string) => void
  onClearFilters: () => void
  onOpenSheet: () => void
  activeFiltersCount: number
}

export function TicketFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  onOpenSheet,
  activeFiltersCount,
}: TicketFiltersBarProps) {
  const hasAnyFilter = activeFiltersCount > 0 || Boolean(search.trim())

  return (
    <div>
      {/* Desktop Toolbar (md:+) */}
      <div className="hidden md:flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <Label htmlFor="search" className="text-xs font-medium text-muted-foreground">
            Buscar
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="search"
              className="w-full pl-8 pr-7 h-9"
              placeholder="Título o #ID"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer rounded p-0.5"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
            Estado
          </Label>
          <DropdownSelect
            id="status-filter"
            className="w-40"
            value={status}
            onChange={onStatusChange}
            options={[
              { value: 'all', label: 'Todos' },
              ...TICKET_STATUSES.map((item) => ({ value: String(item.value), label: item.label })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority-filter" className="text-xs font-medium text-muted-foreground">
            Prioridad
          </Label>
          <DropdownSelect
            id="priority-filter"
            className="w-36"
            value={priority}
            onChange={onPriorityChange}
            options={[
              { value: 'all', label: 'Todas' },
              ...TICKET_PRIORITIES.map((item) => ({ value: String(item.value), label: item.label })),
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start-date-filter" className="text-xs font-medium text-muted-foreground">
            Desde
          </Label>
          <DatePicker
            id="start-date-filter"
            label="Desde"
            data-testid="ticket-filter-start-date"
            className="w-40"
            value={startDate}
            max={endDate || undefined}
            onChange={onStartDateChange}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end-date-filter" className="text-xs font-medium text-muted-foreground">
            Hasta
          </Label>
          <DatePicker
            id="end-date-filter"
            label="Hasta"
            data-testid="ticket-filter-end-date"
            className="w-40"
            value={endDate}
            min={startDate || undefined}
            onChange={onEndDateChange}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="clear-filters-btn"
          onClick={onClearFilters}
          disabled={!hasAnyFilter}
          className="h-9 gap-1.5 cursor-pointer"
        >
          <X className="size-3.5" aria-hidden="true" />
          <span>Limpiar filtros</span>
        </Button>
      </div>

      {/* Mobile Compact Bar (<md): Search Input + Filters Bottom Sheet Trigger */}
      <div className="flex md:hidden items-center gap-2">
        <div className="relative flex-1">
          <Input
            id="mobile-search"
            aria-label="Buscar tickets por título o ID"
            className="w-full h-11 pl-9 pr-8 text-sm bg-card"
            placeholder="Buscar por título o #ID…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Search
            className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant={activeFiltersCount > 0 ? 'default' : 'outline'}
          data-testid="filters-open-btn"
          onClick={onOpenSheet}
          className="relative min-h-[44px] px-3.5 text-xs font-semibold gap-1.5 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-background text-foreground ml-0.5 tabular-nums">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
