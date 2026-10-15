import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

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
 * Closes on Escape and on backdrop click.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with fast fade (< 200ms) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            role="presentation"
            onClick={onClose}
          />

          {/* Modal card with spring physics */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={prefersReduced ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.98 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 350, damping: 30 }
            }
            className={cn(
              'relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl',
              className,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
