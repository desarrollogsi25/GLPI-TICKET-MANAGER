import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { DayButton, DayPicker, type DayButtonProps, type DayPickerProps } from 'react-day-picker'

import { cn } from '@/lib/utils'

function CalendarDayButton(props: DayButtonProps) {
  return <DayButton {...props} data-date={format(props.day.date, 'yyyy-MM-dd')} />
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
      className={cn('w-full rounded-xl bg-card text-card-foreground', className)}
      classNames={{
        months: 'relative w-full',
        month: 'relative w-full space-y-2',
        month_caption: 'mx-10 flex h-11 items-center justify-center gap-1',
        caption_label: 'inline-flex items-center gap-1 text-sm font-semibold capitalize',
        dropdowns: 'flex items-center justify-center gap-2',
        dropdown_root: 'relative flex min-h-10 items-center rounded-xl border border-border px-2 transition-colors hover:bg-primary/10 focus-within:ring-2 focus-within:ring-ring',
        dropdown: 'absolute inset-0 size-full cursor-pointer opacity-0',
        nav: 'flex items-center gap-1',
        button_previous: 'absolute left-0 top-0 grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-30',
        button_next: 'absolute right-0 top-0 grid size-10 shrink-0 place-items-center rounded-xl transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-30',
        month_grid: 'w-full table-fixed border-collapse',
        weekdays: 'w-full',
        weekday: 'h-9 text-center text-xs font-normal text-muted-foreground',
        week: 'w-full',
        day: 'p-0 text-center',
        day_button: 'mx-auto flex size-10 max-w-full items-center justify-center rounded-xl text-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none',
        selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button:hover]:bg-primary/90',
        today: '[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-primary/50',
        outside: 'text-muted-foreground opacity-50',
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
        ...components,
      }}
      {...props}
    />
  )
}
