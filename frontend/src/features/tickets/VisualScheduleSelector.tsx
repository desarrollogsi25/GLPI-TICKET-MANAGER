import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface BusyPeriod {
  startAt: string
  endAt: string
}

export interface VisualScheduleSelectorProps {
  selectedStart: Date | null
  durationMinutes: number
  onSlotSelect: (startDate: Date | null, durationMinutes: number) => void
  busyPeriods?: BusyPeriod[]
  suggestedStart?: string | null
  isAvailable?: boolean
  isFetchingAvailability?: boolean
  timeZone?: string
  technicianName?: string
  disabled?: boolean
  manualInputSection?: React.ReactNode
}

const DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
]

// Daily business hours: 08:00 to 19:00 with 30-minute intervals
const HOUR_SLOTS = [
  { hour: 8, minute: 0 },
  { hour: 8, minute: 30 },
  { hour: 9, minute: 0 },
  { hour: 9, minute: 30 },
  { hour: 10, minute: 0 },
  { hour: 10, minute: 30 },
  { hour: 11, minute: 0 },
  { hour: 11, minute: 30 },
  { hour: 12, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 13, minute: 0 },
  { hour: 13, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 14, minute: 30 },
  { hour: 15, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 16, minute: 0 },
  { hour: 16, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 18, minute: 30 },
]

function formatDurationText(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  if (rem === 0) return hours === 1 ? '1 hora' : `${hours} horas`
  return `${hours}h ${rem}m`
}

function formatHourMinute(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function VisualScheduleSelector({
  selectedStart,
  durationMinutes,
  onSlotSelect,
  busyPeriods = [],
  suggestedStart,
  isAvailable = true,
  isFetchingAvailability = false,
  timeZone,
  technicianName,
  disabled = false,
  manualInputSection,
}: VisualScheduleSelectorProps) {
  const [activeDate, setActiveDate] = useState<Date>(() => {
    if (selectedStart) {
      const d = new Date(selectedStart)
      d.setHours(0, 0, 0, 0)
      return d
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [showManual, setShowManual] = useState(false)

  // Sync activeDate with selectedStart whenever selectedStart points to a different day
  useEffect(() => {
    if (selectedStart) {
      const targetDay = new Date(selectedStart)
      targetDay.setHours(0, 0, 0, 0)
      setActiveDate((prev) => {
        if (prev.getTime() !== targetDay.getTime()) {
          return targetDay
        }
        return prev
      })
    }
  }, [selectedStart])

  const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = useMemo(() => new Date(), [])

  // Check if active day is today
  const isToday = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activeDate.getTime() === today.getTime()
  }, [activeDate])

  const dateLabel = useMemo(() => {
    return activeDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [activeDate])

  // Move day backward/forward: invalidates selection on previous day per P1 requirement
  const changeDay = (daysOffset: number) => {
    const next = new Date(activeDate)
    next.setDate(next.getDate() + daysOffset)
    next.setHours(0, 0, 0, 0)
    setActiveDate(next)
    // Changing the visible day invalidates prior selection and disables confirmation until a new slot is chosen
    onSlotSelect(null, durationMinutes)
  }

  const goToToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setActiveDate(today)
    onSlotSelect(null, durationMinutes)
  }

  // Pre-calculate busy time ranges in ms
  const parsedBusyRanges = useMemo(() => {
    return busyPeriods
      .map((p) => ({
        start: new Date(p.startAt).getTime(),
        end: new Date(p.endAt).getTime(),
      }))
      .filter((r) => !isNaN(r.start) && !isNaN(r.end))
  }, [busyPeriods])

  // Calculate slots for the active day
  const slots = useMemo(() => {
    return HOUR_SLOTS.map(({ hour, minute }) => {
      const slotStart = new Date(activeDate)
      slotStart.setHours(hour, minute, 0, 0)
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60_000)

      const startMs = slotStart.getTime()
      const endMs = slotEnd.getTime()

      // Is past?
      const isPast = startMs < now.getTime()

      // Outside business hours (after 19:00 or spill to next day)?
      const endHour = slotEnd.getHours()
      const endMin = slotEnd.getMinutes()
      const isAfterHours =
        (endHour > 19 || (endHour === 19 && endMin > 0)) ||
        slotEnd.getDate() !== slotStart.getDate()

      // Overlaps any busy period?
      const isBusy = parsedBusyRanges.some(
        (period) => period.start < endMs && period.end > startMs,
      )

      // Is selected?
      const isSelected =
        selectedStart !== null &&
        Math.abs(selectedStart.getTime() - startMs) < 60_000

      return {
        start: slotStart,
        end: slotEnd,
        timeLabel: formatHourMinute(slotStart),
        endLabel: formatHourMinute(slotEnd),
        isPast,
        isAfterHours,
        isBusy,
        isSelected,
      }
    })
  }, [activeDate, durationMinutes, now, parsedBusyRanges, selectedStart])

  // Find first recommended free slot on this day
  const recommendedSlot = useMemo(() => {
    return slots.find((s) => !s.isBusy && !s.isPast && !s.isAfterHours) ?? null
  }, [slots])

  // Selected end time
  const selectedEnd = useMemo(() => {
    if (!selectedStart) return null
    return new Date(selectedStart.getTime() + durationMinutes * 60_000)
  }, [selectedStart, durationMinutes])

  // Is selected start in the past?
  const isSelectedPast = useMemo(() => {
    if (!selectedStart) return false
    return selectedStart.getTime() < now.getTime()
  }, [selectedStart, now])

  return (
    <div className="space-y-3.5 rounded-2xl border border-border/80 bg-card/60 p-3.5 sm:p-4 shadow-xs backdrop-blur-xs">
      {/* Header: Date navigation & Timezone */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0 max-w-[65%] sm:max-w-none">
          <Calendar className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-xs sm:text-sm capitalize text-foreground truncate">{dateLabel}</span>
          {isToday && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4.5 bg-primary/10 text-primary shrink-0">
              Hoy
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => changeDay(-1)}
            className="h-8 w-8 p-0"
            title="Día anterior"
            aria-label="Día anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {!isToday && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={goToToday}
              className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              Hoy
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => changeDay(1)}
            className="h-8 w-8 p-0"
            title="Día siguiente"
            aria-label="Día siguiente"
          >
            <ChevronRight className="size-4" />
          </Button>
          <span className="text-[11px] text-muted-foreground ml-1.5 hidden sm:inline-block">
            {tz}
          </span>
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
          <Clock className="size-3.5 text-primary" /> Duración:
        </span>
        {DURATIONS.map((dur) => {
          const isCurrent = durationMinutes === dur.minutes
          return (
            <button
              key={dur.label}
              type="button"
              disabled={disabled}
              onClick={() => {
                // If a slot is already selected, update duration for it; otherwise update duration without selecting
                if (selectedStart) {
                  onSlotSelect(selectedStart, dur.minutes)
                } else {
                  onSlotSelect(null, dur.minutes)
                }
              }}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 border border-border/70 text-foreground hover:bg-muted hover:border-primary/50'
              }`}
            >
              {dur.label}
            </button>
          )
        })}
      </div>

      {/* Recommendation banner when no slot is selected */}
      {!selectedStart && recommendedSlot && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2.5 text-xs text-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary" />
            <span>
              Franja recomendada para este día:{' '}
              <strong>{recommendedSlot.timeLabel} → {recommendedSlot.endLabel}</strong> ({formatDurationText(durationMinutes)})
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isFetchingAvailability}
            onClick={() => onSlotSelect(recommendedSlot.start, durationMinutes)}
            className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10 shrink-0 self-start sm:self-auto"
          >
            {isFetchingAvailability ? 'Comprobando…' : 'Seleccionar recomendada'}
          </Button>
        </div>
      )}

      {/* Past slot warning if opened task has historical timestamp */}
      {selectedStart && isSelectedPast && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <p className="font-semibold">El horario programado anterior ya ha transcurrido.</p>
            <p className="text-muted-foreground mt-0.5">
              Por favor selecciona una nueva franja disponible a continuación para regularizar la tarea.
            </p>
          </div>
        </div>
      )}

      {/* Visual Time Slots Grid without nested scroll trapping */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Franjas horarias ({slots.length} intervalos):</span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-emerald-500" /> Libre
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" /> Ocupado
            </span>
          </div>
        </div>

        <div className="relative">
          {isFetchingAvailability && (
            <div
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-xs transition-opacity duration-150"
            >
              <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 shadow-sm border border-border/70 text-xs font-medium text-foreground">
                <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Consultando disponibilidad…</span>
              </div>
            </div>
          )}

          {/* Time slots grid with disabled state while fetching */}
          <div
            aria-busy={isFetchingAvailability}
            className={`grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 p-1 border border-border/40 rounded-xl bg-muted/10 transition-opacity duration-150 ${
              isFetchingAvailability ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {slots.map((slot) => {
              const isClickable = !slot.isBusy && !slot.isAfterHours && !disabled && !isFetchingAvailability
              return (
                <button
                  key={slot.timeLabel}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => onSlotSelect(slot.start, durationMinutes)}
                  className={`relative flex flex-col items-center justify-center min-h-[46px] p-1.5 sm:p-2 rounded-lg text-xs transition-all cursor-pointer ${
                    slot.isSelected
                      ? 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary ring-offset-1 shadow-sm'
                      : slot.isBusy
                        ? 'bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 cursor-not-allowed opacity-75'
                        : slot.isAfterHours
                          ? 'bg-muted/20 border border-border/30 text-muted-foreground/50 cursor-not-allowed'
                          : slot.isPast
                            ? 'bg-muted/30 border border-border/40 text-muted-foreground/60 hover:bg-muted/50'
                            : 'bg-background/90 border border-border/70 text-foreground hover:border-primary/60 hover:bg-primary/5'
                  }`}
                >
                  <span className="font-mono text-xs sm:text-sm font-semibold leading-none">{slot.timeLabel}</span>
                  <span className="text-[10px] opacity-75 leading-tight mt-0.5">
                    → {slot.endLabel}
                  </span>
                  {slot.isSelected && (
                    <Check className="size-3 absolute top-1 right-1 text-primary-foreground" />
                  )}
                  {slot.isBusy && !slot.isSelected && (
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 font-medium leading-none mt-0.5">
                      Ocupado
                    </span>
                  )}
                  {slot.isAfterHours && !slot.isBusy && (
                    <span className="text-[9px] text-muted-foreground/60 font-medium leading-none mt-0.5">
                      Excede 19h
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Unequivocal Schedule Summary Banner */}
      {selectedStart && selectedEnd ? (
        <div
          className={`space-y-1.5 rounded-xl p-3 text-xs transition-all ${
            isAvailable
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/15 pb-1.5 font-semibold">
            <span className="flex items-center gap-1.5">
              {isFetchingAvailability ? (
                <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : isAvailable ? (
                <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              {isFetchingAvailability
                ? 'Comprobando disponibilidad…'
                : isAvailable
                  ? 'Horario seleccionado confirmado y disponible'
                  : 'Horario con conflicto de disponibilidad'}
            </span>
            <Badge variant="outline" className="text-[10px] border-current/30 text-current">
              {tz}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-0.5 text-[11px]">
            {technicianName && (
              <div className="flex items-center gap-1">
                <User className="size-3 text-current/70 shrink-0" />
                <span className="text-current/80">Técnico:</span>
                <strong className="text-current truncate">{technicianName}</strong>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="size-3 text-current/70 shrink-0" />
              <span className="text-current/80">Fecha:</span>
              <strong className="text-current capitalize truncate">{dateLabel}</strong>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3 text-current/70 shrink-0" />
              <span className="text-current/80">Horario:</span>
              <strong className="text-current font-mono">
                {formatHourMinute(selectedStart)} → {formatHourMinute(selectedEnd)}
              </strong>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-current/80">Duración:</span>
              <strong className="text-current">{formatDurationText(durationMinutes)}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs text-muted-foreground">
          <Clock className="size-4 shrink-0 text-primary/70" />
          <span>Selecciona una franja horaria en la cuadrícula superior para confirmar la programación.</span>
        </div>
      )}

      {/* Auto-suggest alternative free slot on conflict */}
      {!isAvailable && suggestedStart && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 p-2.5 text-xs text-foreground">
          <div className="flex items-start gap-2">
            <Sparkles className="size-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p className="font-semibold text-primary">Alternativa disponible más próxima:</p>
              <p className="text-muted-foreground">
                {new Date(suggestedStart).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}{' '}
                {formatHourMinute(new Date(suggestedStart))} →{' '}
                {formatHourMinute(new Date(new Date(suggestedStart).getTime() + durationMinutes * 60_000))}
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => {
              const sugDate = new Date(suggestedStart)
              const d = new Date(sugDate)
              d.setHours(0, 0, 0, 0)
              setActiveDate(d)
              onSlotSelect(sugDate, durationMinutes)
            }}
            className="shrink-0 border-primary/50 text-primary hover:bg-primary/10"
          >
            Usar este horario
          </Button>
        </div>
      )}

      {/* Accessible manual input collapsible */}
      {manualInputSection && (
        <div className="border-t border-border/40 pt-2">
          <button
            type="button"
            onClick={() => setShowManual((prev) => !prev)}
            className="flex w-full items-center justify-between py-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <span>Entrada manual de fecha y hora exacta (accesibilidad)</span>
            {showManual ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          {showManual && (
            <div className="mt-2 space-y-2 rounded-xl bg-muted/20 p-2.5 border border-border/50">
              {manualInputSection}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
