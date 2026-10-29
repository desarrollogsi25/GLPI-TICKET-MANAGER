import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { memo, useCallback, useEffect, useId, useState } from 'react'
import type { Matcher } from 'react-day-picker'

import { Calendar } from '@/components/ui/calendar'
import { Popover } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  id?: string
  className?: string
  placeholder?: string
  min?: string
  max?: string
  'data-testid'?: string
}

const localDate = (value?: string) => {
  if (!value) return undefined
  const date = parseISO(value)
  return isValid(date) ? date : undefined
}

const toValue = (day?: Date) => (day ? format(day, 'yyyy-MM-dd') : '')

/**
 * The calendar only edits a local draft. `onChange` fires when the user confirms,
 * so selecting a day never writes the URL (or the parent filter state) mid-render.
 */
function DatePickerBase({ value, onChange, label, id, className, placeholder, min, max, ...rest }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Date | undefined>(() => localDate(value))
  const generatedId = useId()

  // External changes (deep links, "Limpiar filtros") win over an unapplied draft.
  useEffect(() => {
    setDraft((current) => (toValue(current) === value ? current : localDate(value)))
  }, [value])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) setDraft(localDate(value))
      setOpen(nextOpen)
    },
    [value],
  )

  const handleSelect = useCallback((day?: Date) => {
    setDraft(day)
  }, [])

  const selected = localDate(value)
  const earliest = localDate(min)
  const latest = localDate(max)
  const disabled: Matcher[] = []
  if (earliest) disabled.push({ before: earliest })
  if (latest) disabled.push({ after: latest })
  const today = new Date()
  const initialDate = draft ?? (earliest && today < earliest ? earliest : latest && today > latest ? latest : today)

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      label={label}
      triggerProps={{ id: id || generatedId, className: cn('justify-start', className), 'data-testid': rest['data-testid'] }}
      trigger={
        <>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? format(selected, 'dd/MM/yyyy', { locale: es }) : placeholder || (label.toLowerCase().includes('desde') ? 'Desde: elegir fecha' : 'Hasta: elegir fecha')}
          </span>
        </>
      }
    >
      {(close) => (
        <>
          <Calendar
            mode="single"
            autoFocus
            selected={draft}
            defaultMonth={initialDate}
            // A wider default range turns the year listbox into 200+ rows.
            startMonth={earliest ?? new Date(2000, 0, 1)}
            endMonth={latest ?? new Date(today.getFullYear() + 10, 11, 1)}
            disabled={disabled}
            aria-label={`Calendario: ${label}`}
            onSelect={handleSelect}
          />
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
            <button
              type="button"
              onClick={() => {
                setDraft(undefined)
                onChange('')
                close()
              }}
              className="min-h-10 rounded-xl px-3 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Borrar fecha
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                className="min-h-10 rounded-xl px-3 text-xs font-medium hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={!draft}
                onClick={() => {
                  onChange(toValue(draft))
                  close()
                }}
                className="min-h-10 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </Popover>
  )
}

const DatePicker = memo(DatePickerBase)
DatePicker.displayName = 'DatePicker'

export { DatePicker }
