import { useEffect, useId, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  label: string
  trigger: ReactNode
  triggerProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> & { 'data-testid'?: string }
  children: ReactNode | ((close: () => void) => ReactNode)
}

/** Anchored, themed dialog with viewport collision handling and focus restoration. */
export function Popover({ open, onOpenChange, label, trigger, triggerProps, children }: PopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 })
  const contentId = useId()
  const close = () => {
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(320, window.innerWidth - 24)
      const height = contentRef.current?.offsetHeight || 390
      const top = rect.bottom + height + 8 <= window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - height - 8)
      setPosition({ top, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)), width })
    }
    update()
    const observer = new ResizeObserver(update)
    if (contentRef.current) observer.observe(contentRef.current)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    // The calendar's month/year listbox lives in its own portal; treating it as
    // "outside" would unmount the calendar on the first option click.
    const inNestedPortal = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('[data-dropdown-portal="true"]'))
    const outside = (event: Event) => {
      if (inNestedPortal(event.target)) return
      const target = event.target as Node
      if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) onOpenChange(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || inNestedPortal(event.target)) return
      event.preventDefault()
      // A calendar inside the mobile filter sheet closes before its parent sheet.
      event.stopPropagation()
      onOpenChange(false)
      triggerRef.current?.focus()
    }
    const focusFallback = requestAnimationFrame(() => {
      if (!contentRef.current?.contains(document.activeElement)) {
        contentRef.current?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]')?.focus()
      }
    })
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    return () => {
      cancelAnimationFrame(focusFallback)
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open, onOpenChange])

  return (
    <>
      <button
        {...triggerProps}
        ref={triggerRef}
        type="button"
        aria-label={triggerProps?.['aria-label'] || label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? contentId : undefined}
        className={cn('inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background/50 px-3 text-xs shadow-xs transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', triggerProps?.className)}
        onClick={() => onOpenChange(!open)}
      >{trigger}</button>
      {open && createPortal(
        <div ref={contentRef} id={contentId} role="dialog" aria-label={label} data-calendar-popover="true" style={position} className="fixed z-[80] max-h-[calc(100dvh-24px)] overflow-auto rounded-2xl border border-border/70 bg-card/95 p-3 text-card-foreground shadow-2xl ring-1 ring-border/40 backdrop-blur-xl">
          {typeof children === 'function' ? children(close) : children}
        </div>, document.body,
      )}
    </>
  )
}
