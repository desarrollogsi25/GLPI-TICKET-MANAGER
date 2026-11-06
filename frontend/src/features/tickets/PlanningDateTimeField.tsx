import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarClock, Clock3 } from 'lucide-react'

import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PlanningDateTimeFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  testId?: string
  disabled?: boolean
}

/**
 * A themed calendar and one-tap time shortcuts complement the precise native
 * date/time input. Keeping that input available preserves keyboard, screen-reader
 * and mobile automation support instead of hiding an inaccessible test control.
 * All edits remain local wall-clock values and are validated for DST by the form.
 */
export function PlanningDateTimeField({ id, label, value, onChange, testId, disabled }: PlanningDateTimeFieldProps) {
  const [date = '', time = ''] = value.split('T')
  const parsed = value ? parseISO(value) : null
  const preview = parsed && isValid(parsed)
    ? format(parsed, "EEEE d 'de' MMMM, HH:mm", { locale: es })
    : 'Selecciona una fecha y una hora válidas'

  const setDate = (nextDate: string) => onChange(nextDate ? `${nextDate}T${time || '09:00'}` : '')
  const setTime = (nextTime: string) => {
    if (date) onChange(`${date}T${nextTime}`)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
          <CalendarClock className="size-4 text-primary" aria-hidden="true" />
          {label}
        </Label>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Horario local
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          type="datetime-local"
          required
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          data-testid={testId}
          className="min-h-11 min-w-0 flex-1 rounded-xl border-border/80 bg-background/85 px-3 text-sm font-medium shadow-xs [color-scheme:light] dark:[color-scheme:dark]"
        />
        <DatePicker
          id={`${id}-calendar`}
          value={date}
          onChange={setDate}
          disabled={disabled}
          label={`Elegir fecha para ${label.toLowerCase()}`}
          placeholder="Elegir fecha"
          className="min-h-11 w-full shrink-0 justify-center border-primary/30 bg-primary/5 font-medium text-primary hover:bg-primary/10 sm:w-auto"
        />
      </div>
      <p className="flex items-center gap-1.5 text-xs font-medium capitalize text-foreground/80" aria-live="polite">
        <Clock3 className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        {preview}
      </p>
      <div className="flex flex-wrap items-center gap-1.5" aria-label={`Horas rápidas para ${label.toLowerCase()}`}>
        <span className="mr-1 text-[11px] text-muted-foreground">Hora rápida:</span>
        {['09:00', '13:00', '17:00'].map((hour) => (
          <button
            key={hour}
            type="button"
            disabled={disabled || !date}
            onClick={() => setTime(hour)}
            aria-label={`Elegir ${hour} para ${label.toLowerCase()}`}
            aria-pressed={time === hour}
            className={cn(
              'min-h-8 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
              time === hour
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {hour}
          </button>
        ))}
      </div>
    </div>
  )
}
