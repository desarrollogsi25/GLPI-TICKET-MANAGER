import { Check, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

export interface DropdownOption {
  value: string
  label: string
  /** Optional leading adornment (e.g. a color dot). */
  icon?: ReactNode
}

interface DropdownSelectProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  id?: string
  'aria-label'?: string
  'data-testid'?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Themed dropdown (headless, no native <select>) used wherever the system
 * select looked generic. Hover/active items use `bg-primary/10 text-primary`
 * instead of the OS blue, and the selected item shows a Check icon.
 * Full keyboard support: Arrow keys, Home/End, Enter/Space, Escape, typeahead-free.
 */
export function DropdownSelect({
  value,
  onChange,
  options,
  id,
  placeholder = 'Seleccionar',
  className,
  disabled,
  ...rest
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; flipUp: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)

  const close = useCallback((focusTrigger = true) => {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  const openMenu = () => {
    if (disabled) return
    const idx = Math.max(0, options.findIndex((o) => o.value === value))
    setActiveIndex(idx)
    setOpen(true)
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      const estimated = Math.min(options.length * 34 + 12, 280)
      const flipUp = window.innerHeight - r.bottom < estimated + 12 && r.top > estimated
      setRect({ top: flipUp ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, flipUp })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) return
      close(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, close])

  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open, rect])

  const commit = (v: string) => {
    if (v !== value) onChange(v)
    close()
  }

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % options.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + options.length) % options.length)
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (options[activeIndex]) commit(options[activeIndex].value)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        close(false)
        break
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={rest['aria-label']}
        data-testid={rest['data-testid']}
        disabled={disabled}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            openMenu()
          }
        }}
        className={cn(
          'inline-flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
          'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon}
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && rect
        ? createPortal(
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={`${listId}-${activeIndex}`}
              onKeyDown={onListKeyDown}
              style={{
                position: 'fixed',
                left: rect.left,
                minWidth: Math.max(rect.width, 160),
                ...(rect.flipUp ? { bottom: window.innerHeight - rect.top } : { top: rect.top }),
              }}
              className={cn(
                'z-[100] max-h-72 overflow-y-auto rounded-xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md outline-none',
                'animate-in fade-in-0 zoom-in-95',
              )}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                return (
                  <div
                    key={option.value}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => commit(option.value)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                      index === activeIndex && 'bg-primary/10 text-primary',
                      isSelected && 'font-medium',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" /> : null}
                  </div>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
