import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

/**
 * Animated modal dialog respecting motion curves and reduced-motion preferences.
 * Includes accessible focus trap, closes on Escape and on backdrop click.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const prefersReduced = useReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  // Keep the latest onClose reference without triggering effect re-runs
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeout = setTimeout(() => {
      if (dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length > 0) {
          focusables[0].focus()
        }
      }
    }, 50)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }

      if (event.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusables.length === 0) return

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fast fade (< 200ms) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            role="presentation"
            onClick={onClose}
          />

          {/* Modal card with Emil Kowalski ease-out entrance (scale 0.95 -> 1, 200ms) */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby={description ? 'dialog-description' : undefined}
            initial={
              prefersReduced
                ? false
                : { opacity: 0, transform: 'scale(0.95) translateY(6px)' }
            }
            animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
            exit={
              prefersReduced
                ? undefined
                : { opacity: 0, transform: 'scale(0.97) translateY(4px)' }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl',
              className,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 space-y-1">
              <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">{title}</h2>
              {description ? <p id="dialog-description" className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}