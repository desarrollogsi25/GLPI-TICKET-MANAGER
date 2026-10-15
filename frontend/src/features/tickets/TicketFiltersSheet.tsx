import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

import { TICKET_PRIORITIES, TICKET_STATUSES } from './labels'

interface TicketFiltersSheetProps {
  open: boolean
  onClose: () => void
  status: string
  onStatusChange: (status: string) => void
  priority: string
  onPriorityChange: (priority: string) => void
  onApply: () => void
  onReset: () => void
  activeFiltersCount: number
}

export function TicketFiltersSheet({
  open,
  onClose,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  onApply,
  onReset,
  activeFiltersCount,
}: TicketFiltersSheetProps) {
  const prefersReduced = useReducedMotion()

  // Cerrar al pulsar Escape
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Bloquear scroll del body al abrir el sheet
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={prefersReduced ? { duration: 0 } : { duration: 0.18 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom Sheet */}
          <motion.div
            data-testid="filters-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de tickets"
            initial={prefersReduced ? false : { y: '100%' }}
            animate={{ y: 0 }}
            exit={prefersReduced ? undefined : { y: '100%' }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', damping: 28, stiffness: 320 }
            }
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.5 }}
            onDragEnd={(_e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 300) {
                onClose()
              }
            }}
            className="relative z-10 w-full max-h-[85vh] flex flex-col rounded-t-3xl border-t border-border bg-card shadow-2xl overflow-hidden"
          >
            {/* Handle táctil superior */}
            <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Filtros</h2>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer transition-colors"
                aria-label="Cerrar filtros"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido scrolleable de filtros */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Filtro Estado */}
              <div className="space-y-2">
                <Label htmlFor="sheet-status-filter" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Estado
                </Label>
                <Select
                  id="sheet-status-filter"
                  className="w-full h-11 text-sm bg-background"
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  {TICKET_STATUSES.map((item) => (
                    <option key={item.value} value={String(item.value)}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Filtro Prioridad */}
              <div className="space-y-2">
                <Label htmlFor="sheet-priority-filter" className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  Prioridad
                </Label>
                <Select
                  id="sheet-priority-filter"
                  className="w-full h-11 text-sm bg-background"
                  value={priority}
                  onChange={(e) => onPriorityChange(e.target.value)}
                >
                  <option value="all">Todas las prioridades</option>
                  {TICKET_PRIORITIES.map((item) => (
                    <option key={item.value} value={String(item.value)}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Footer con botones de acción */}
            <div className="p-4 border-t border-border bg-card/90 backdrop-blur-xs flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 min-h-[44px] text-sm"
                onClick={onReset}
              >
                Limpiar todo
              </Button>
              <Button
                type="button"
                variant="default"
                className="flex-1 min-h-[44px] text-sm font-semibold"
                onClick={() => {
                  onApply()
                  onClose()
                }}
              >
                Aplicar filtros
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
