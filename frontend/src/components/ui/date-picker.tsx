import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  label: string
  min?: string
  max?: string
  'data-testid'?: string
}

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const parseDate = (value: string) => new Date(`${value}T12:00:00`)
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 12)
const moveDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12)
const moveMonth = (date: Date, amount: number) => {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + amount + 1, 0).getDate()
  return new Date(date.getFullYear(), date.getMonth() + amount, Math.min(date.getDate(), lastDay), 12)
}

/** Calendar dates stay local YYYY-MM-DD values, matching the dashboard's existing filters. */
export function DatePicker({ value, onChange, label, min, max, ...rest }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(() => new Date())
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const calendarId = useId()
  const titleId = useId()

  const clamp = (date: Date) => {
    const key = dateKey(date)
    return min && key < min ? parseDate(min) : max && key > max ? parseDate(max) : date
  }
  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }
  const show = () => {
    const initial = clamp(value ? parseDate(value) : new Date())
    setActive(initial)
    setMonth(monthStart(initial))
    setOpen(true)
  }
  const select = (date: Date) => {
    onChange(dateKey(date))
    close()
  }

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 24)
      const height = panelRef.current?.offsetHeight || 390
      const top = rect.bottom + height + 8 <= window.innerHeight
        ? rect.bottom + 8
        : Math.max(12, rect.top - height - 8)
      setPosition({ top, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, month])

  useEffect(() => {
    if (!open) return
    panelRef.current?.querySelector<HTMLButtonElement>(`[data-date="${dateKey(active)}"]`)?.focus()
  }, [open, active])

  useEffect(() => {
    if (!open) return
    const outside = (event: Event) => {
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  const navigateDay = (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
    const weekday = (date.getDay() + 6) % 7
    const next = event.key === 'ArrowLeft' ? moveDays(date, -1)
      : event.key === 'ArrowRight' ? moveDays(date, 1)
      : event.key === 'ArrowUp' ? moveDays(date, -7)
      : event.key === 'ArrowDown' ? moveDays(date, 7)
      : event.key === 'Home' ? moveDays(date, -weekday)
      : event.key === 'End' ? moveDays(date, 6 - weekday)
      : event.key === 'PageUp' ? moveMonth(date, -1)
      : event.key === 'PageDown' ? moveMonth(date, 1) : null
    if (!next) return
    event.preventDefault()
    const target = clamp(next)
    setActive(target)
    setMonth(monthStart(target))
  }
  const changeMonth = (amount: number) => {
    const next = clamp(moveMonth(active, amount))
    setActive(next)
    setMonth(monthStart(next))
  }
  const firstDay = moveDays(month, -((month.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, index) => moveDays(firstDay, index))
  const previousDisabled = !!min && dateKey(new Date(month.getFullYear(), month.getMonth(), 0, 12)) < min
  const nextDisabled = !!max && dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12)) > max

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? calendarId : undefined}
        onClick={() => open ? close() : show()}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-background/50 px-3 text-xs shadow-xs transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        {...rest}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">{label.includes('desde') ? 'Desde:' : 'Hasta:'}</span>
        <span>{value ? parseDate(value).toLocaleDateString('es-ES') : 'Elegir fecha'}</span>
      </button>
      {open && createPortal(
        <div
          ref={panelRef}
          id={calendarId}
          role="dialog"
          aria-label={label}
          className="fixed z-50 max-h-[calc(100dvh-24px)] overflow-auto rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
          style={position}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button type="button" aria-label="Mes anterior" disabled={previousDisabled} onClick={() => changeMonth(-1)} className="grid size-10 place-items-center rounded-xl hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <p id={titleId} aria-live="polite" className="text-sm font-semibold capitalize">{month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
            <button type="button" aria-label="Mes siguiente" disabled={nextDisabled} onClick={() => changeMonth(1)} className="grid size-10 place-items-center rounded-xl hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30">
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div role="grid" aria-labelledby={titleId}>
            <div role="row" className="grid grid-cols-7">
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map((day) => <span key={day} role="columnheader" className="py-2 text-center text-xs text-muted-foreground">{day}</span>)}
            </div>
            {Array.from({ length: 6 }, (_, week) => (
              <div role="row" key={week} className="grid grid-cols-7">
                {days.slice(week * 7, week * 7 + 7).map((day) => {
                  const key = dateKey(day)
                  const disabled = !!((min && key < min) || (max && key > max))
                  return (
                    <div role="gridcell" key={key} aria-selected={value === key}>
                      <button
                        type="button"
                        data-date={key}
                        tabIndex={dateKey(active) === key ? 0 : -1}
                        disabled={disabled}
                        aria-label={day.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        aria-current={key === dateKey(new Date()) ? 'date' : undefined}
                        onKeyDown={(event) => navigateDay(event, day)}
                        onClick={() => select(day)}
                        className={cn('grid min-h-10 w-full place-items-center rounded-lg text-sm transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-25 disabled:hover:bg-transparent', day.getMonth() !== month.getMonth() && 'text-muted-foreground', value === key && 'bg-primary text-primary-foreground hover:bg-primary/90')}
                      >{day.getDate()}</button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2 border-t border-border pt-2">
            <button type="button" onClick={() => { onChange(''); close() }} className="min-h-10 rounded-xl px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Borrar fecha</button>
            <button type="button" onClick={() => close()} className="min-h-10 rounded-xl px-3 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cerrar</button>
          </div>
        </div>, document.body,
      )}
    </>
  )
}
