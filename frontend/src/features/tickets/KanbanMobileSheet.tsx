import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { priorityMeta, statusMeta } from './labels'

export type ColumnId = 'queue' | 'mine' | 'in_progress' | 'pending' | 'resolved'

interface KanbanMobileSheetProps {
  ticket: TicketSummary | null
  currentColumn: ColumnId | null
  isOpen: boolean
  onClose: () => void
  onClaim: (ticketId: number) => void
  onStart: (ticketId: number) => void
  onPause: (ticketId: number) => void
  onResume: (ticketId: number) => void
  onResolve: (ticketId: number) => void
}

export function KanbanMobileSheet({
  ticket,
  currentColumn,
  isOpen,
  onClose,
  onClaim,
  onStart,
  onPause,
  onResume,
  onResolve,
}: KanbanMobileSheetProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!ticket || !currentColumn) return null

  const status = statusMeta(ticket.status)
  const priority = priorityMeta(ticket.priority)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-sheet-title"
            data-testid="kanban-mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-50 w-full rounded-t-2xl bg-card border-t border-border shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-4 max-h-[85vh] overflow-y-auto"
          >
            {/* Grab handle indicator */}
            <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30 mb-2" />

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  #{ticket.id}
                </span>
                <Badge className={cn('text-[10px] px-2 py-0.5 font-medium', status.badgeClass)}>
                  {status.label}
                </Badge>
                <Badge className={cn('text-[10px] px-2 py-0.5 font-medium', priority.badgeClass)}>
                  {priority.label}
                </Badge>
              </div>
              <h2 id="mobile-sheet-title" className="text-base font-semibold text-foreground line-clamp-2">
                {ticket.title}
              </h2>
            </div>

            {/* Column Movement Actions */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Acciones de estado
              </p>

              {currentColumn === 'queue' && (
                <Button
                  className="w-full h-12 text-sm font-medium justify-center gap-2"
                  onClick={() => {
                    onClose()
                    onClaim(ticket.id)
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Mover a Mis tickets (Asignarme)
                </Button>
              )}

              {currentColumn === 'mine' && (
                <Button
                  className="w-full h-12 text-sm font-medium justify-center gap-2"
                  onClick={() => {
                    onClose()
                    onStart(ticket.id)
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Mover a En progreso
                </Button>
              )}

              {currentColumn === 'in_progress' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-sm font-medium justify-center gap-2 border-amber-300 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={() => {
                      onClose()
                      onPause(ticket.id)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    Mover a Pendiente (Pausar)
                  </Button>
                  <Button
                    className="w-full h-12 text-sm font-medium justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                    onClick={() => {
                      onClose()
                      onResolve(ticket.id)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mover a Resuelto
                  </Button>
                </>
              )}

              {currentColumn === 'pending' && (
                <>
                  <Button
                    className="w-full h-12 text-sm font-medium justify-center gap-2"
                    onClick={() => {
                      onClose()
                      onResume(ticket.id)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Mover a En progreso (Retomar)
                  </Button>
                  <Button
                    className="w-full h-12 text-sm font-medium justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
                    onClick={() => {
                      onClose()
                      onResolve(ticket.id)
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Mover a Resuelto
                  </Button>
                </>
              )}

              {currentColumn === 'resolved' && (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Este ticket ya está completado y resuelto.
                </p>
              )}
            </div>

            {/* Links and Dismiss */}
            <div className="pt-2 border-t border-border/50 flex flex-col gap-2">
              <Link
                to={`/tickets/${ticket.id}`}
                onClick={onClose}
                className="w-full text-center py-2.5 text-xs font-semibold text-primary hover:underline"
              >
                Ver ficha completa del ticket →
              </Link>

              <Button
                variant="ghost"
                className="w-full h-11 text-xs text-muted-foreground"
                onClick={onClose}
              >
                Cerrar
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
