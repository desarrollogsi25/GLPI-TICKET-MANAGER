import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { useId, useState } from 'react'
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

/** Keep the existing local YYYY-MM-DD callback contract for URL and team filters. */
export function DatePicker({ value, onChange, label, id, className, placeholder, min, max, ...rest }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const generatedId = useId()
  const selected = localDate(value)
  const earliest = localDate(min)
  const latest = localDate(max)
  const disabled: Matcher[] = []
  if (earliest) disabled.push({ before: earliest })
  if (latest) disabled.push({ after: latest })
  const today = new Date()
  const initialDate = selected ?? (earliest && today < earliest ? earliest : latest && today > latest ? latest : today)

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      label={label}
      triggerProps={{ id: id || generatedId, className: cn('justify-start', className), 'data-testid': rest['data-testid'] }}
      trigger={
        <>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
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
            selected={selected}
            defaultMonth={initialDate}
            startMonth={earliest ?? new Date(1900, 0, 1)}
            endMonth={latest ?? new Date(today.getFullYear() + 100, 11, 1)}
            disabled={disabled}
            aria-label={`Calendario: ${label}`}
            onSelect={(day) => {
              onChange(day ? format(day, 'yyyy-MM-dd') : '')
              close()
            }}
          />
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => { onChange(''); close() }} className="min-h-10 rounded-xl px-3 text-xs font-medium hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Borrar fecha</button>
            <button type="button" onClick={close} className="min-h-10 rounded-xl px-3 text-xs font-medium hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cerrar</button>
          </div>
        </>
      )}
    </Popover>
  )
}
