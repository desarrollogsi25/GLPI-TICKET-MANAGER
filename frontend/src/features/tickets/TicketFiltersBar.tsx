import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownSelect } from '@/components/ui/dropdown-select'

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
  return (
    <div>
      {/* Vista Desktop (md:+): Fila horizontal */}
      <div className="hidden md:flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            className="w-56"
            placeholder="Título o #ID"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="status-filter">Estado</Label>
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

        <div className="space-y-1">
          <Label htmlFor="priority-filter">Prioridad</Label>
          <DropdownSelect
            id="priority-filter"
            className="w-40"
            value={priority}
            onChange={onPriorityChange}
            options={[
              { value: 'all', label: 'Todas' },
              ...TICKET_PRIORITIES.map((item) => ({ value: String(item.value), label: item.label })),
            ]}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="start-date-filter">Desde</Label>
          <Input
            id="start-date-filter"
            type="date"
            className="w-40"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="end-date-filter">Hasta</Label>
          <Input
            id="end-date-filter"
            type="date"
            className="w-40"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          data-testid="clear-filters-btn"
          onClick={onClearFilters}
          disabled={activeFiltersCount === 0 && !search.trim()}
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Vista Móvil (<md): Input + Botón Filtros (Bottom Sheet) */}
      <div className="flex md:hidden items-center gap-2">
        <div className="relative flex-1">
          <Input
            id="mobile-search"
            aria-label="Buscar tickets por título o ID"
            className="w-full h-11 pl-9 pr-3 text-sm bg-card"
            placeholder="Buscar por título o #ID..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <Button
          type="button"
          variant={activeFiltersCount > 0 ? 'default' : 'outline'}
          data-testid="filters-open-btn"
          onClick={onOpenSheet}
          className="relative min-h-[44px] px-3.5 text-xs font-semibold gap-1.5 shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-background text-foreground ml-0.5">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
