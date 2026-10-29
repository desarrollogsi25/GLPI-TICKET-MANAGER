import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import type { ChangeEvent } from 'react'
import { DayButton, DayPicker, type DayButtonProps, type DayPickerProps, type DropdownProps } from 'react-day-picker'

import { DropdownSelect } from '@/components/ui/dropdown-select'
import { cn } from '@/lib/utils'

function CalendarDayButton(props: DayButtonProps) {
  return <DayButton {...props} data-date={format(props.day.date, 'yyyy-MM-dd')} />
}

/**
 * Native <select> popups ignore the active theme (white rows, OS scrollbar), so the
 * month/year dropdowns use the app's themed listbox instead.
 */
function CalendarDropdown({ options = [], value, onChange, disabled, 'aria-label': ariaLabel }: DropdownProps) {
  return (
    <DropdownSelect
      aria-label={ariaLabel}
      value={String(value ?? '')}
      disabled={disabled}
      options={options.map((option) => ({ value: String(option.value), label: option.label }))}
      onChange={(next) => {
        onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>)
      }}
      className="h-10 w-auto min-w-20 rounded-xl border-border/70 bg-card/60 px-3 text-sm font-semibold shadow-none hover:bg-primary/10"
      listClassName="no-scrollbar"
    />
  )
}

/** DayPicker owns date navigation and keyboard behavior; theme tokens own its appearance. */
export function Calendar({ className, classNames, components, ...props }: DayPickerProps) {
  return (
    <DayPicker
      locale={es}
      weekStartsOn={1}
      showOutsideDays
      fixedWeeks
      navLayout="around"
      captionLayout="dropdown"
      className={cn('w-full rounded-xl bg-transparent text-card-foreground', className)}
      classNames={{
        months: 'relative w-full',
        month: 'relative w-full space-y-2',
        month_caption: 'mx-10 flex h-11 items-center justify-center gap-2',
        caption_label: 'inline-flex items-center gap-1 text-sm font-semibold capitalize',
        dropdowns: 'flex items-center justify-center gap-2',
        nav: 'flex items-center gap-1',
        button_previous: 'absolute left-0 top-0 grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-30',
        button_next: 'absolute right-0 top-0 grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-30',
        month_grid: 'w-full table-fixed border-collapse',
        weekdays: 'w-full',
        weekday: 'h-9 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground',
        week: 'w-full',
        day: 'p-0 text-center',
        day_button: 'mx-auto flex size-10 max-w-full items-center justify-center rounded-full text-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none',
        selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:shadow-sm [&>button:hover]:bg-primary/90',
        today: '[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-primary/50',
        outside: 'text-muted-foreground/50',
        disabled: 'opacity-25',
        hidden: 'invisible',
        ...classNames,
      }}
      labels={{
        labelPrevious: () => 'Mes anterior',
        labelNext: () => 'Mes siguiente',
        labelMonthDropdown: () => 'Mes',
        labelYearDropdown: () => 'Año',
        labelDayButton: (day, modifiers) => `${format(day, 'd MMMM yyyy', { locale: es })}${modifiers.selected ? ', seleccionado' : ''}`,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) => {
          const Icon = orientation === 'left' ? ChevronLeft : orientation === 'right' ? ChevronRight : orientation === 'up' ? ChevronUp : ChevronDown
          return <Icon className={cn('size-4', chevronClass)} aria-hidden="true" />
        },
        DayButton: CalendarDayButton,
        Dropdown: CalendarDropdown,
        ...components,
      }}
      {...props}
    />
  )
}
