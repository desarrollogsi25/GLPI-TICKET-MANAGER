import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

import { priorityMeta, statusMeta } from './labels'

interface TicketListCardProps {
  ticket: TicketSummary
}

export function TicketListCard({ ticket }: TicketListCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const priority = priorityMeta(ticket.priority)
  const status = statusMeta(ticket.status)

  return (
    <article
      data-testid="ticket-card"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className="rounded-xl border border-border bg-card p-4 transition-all duration-150 ease-out shadow-xs hover:border-primary/40 text-foreground cursor-pointer active:scale-[0.99]"
    >
      {/* Vista Compacta Inicial: Título, Estado y Fecha */}
      <div className="space-y-2">
        <Link
          to={`/tickets/${ticket.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <h3 className="text-sm font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
            {ticket.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[10px] px-2 py-0.5 font-medium', status.badgeClass)}>
              {status.label}
            </Badge>
            <span className="text-muted-foreground">{formatRelative(ticket.updatedAt)}</span>
          </div>

          {/* Botón "Ver detalles" con divulgación progresiva */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsExpanded((prev) => !prev)
            }}
            data-testid={`toggle-details-${ticket.id}`}
            aria-expanded={isExpanded}
            className="h-7 px-2 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 flex items-center cursor-pointer"
          >
            <span>{isExpanded ? 'Ocultar' : 'Ver detalles'}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Divulgación Progresiva: Detalles adicionales expandibles */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden pt-3 mt-3 border-t border-dashed border-border/60 text-xs space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
              <div>
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  ID Ticket
                </span>
                <span className="font-mono text-xs font-bold text-foreground">#{ticket.id}</span>
              </div>
              <div>
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  Prioridad
                </span>
                <Badge className={cn('text-[10px] px-1.5 py-0 font-medium mt-0.5', priority.badgeClass)}>
                  {priority.label}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-muted-foreground/80">
                  Tipo de solicitud
                </span>
                <span className="text-xs text-foreground font-medium">{ticket.typeLabel || 'Incidencia'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                to={`/tickets/${ticket.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Abrir ficha completa →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  )
}
