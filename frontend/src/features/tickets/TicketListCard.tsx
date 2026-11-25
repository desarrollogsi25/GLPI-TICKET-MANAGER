import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { PriorityBadge, StatusBadge } from '@/components/ui/status-badge'
import type { TicketSummary } from '@/lib/api/types'
import { formatRelative } from '@/lib/format'
import { cn } from '@/lib/utils'

import { priorityMeta, typeLabel } from './labels'

interface TicketListCardProps {
  ticket: TicketSummary
}

export function TicketListCard({ ticket }: TicketListCardProps) {
  const navigate = useNavigate()
  const [isExpanded, setIsExpanded] = useState(false)
  const priority = priorityMeta(ticket.priority)

  return (
    <article
      data-testid="ticket-card"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
      className={cn(
        'rounded-xl border border-border border-l-[3px] bg-card p-3.5 transition-all duration-150 ease-out shadow-xs hover:border-primary/40 text-foreground cursor-pointer active:scale-[0.99]',
        priority.stripeClass,
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">#{ticket.id}</span>
            <span className="text-[11px] text-muted-foreground truncate">· {formatRelative(ticket.updatedAt)}</span>
          </div>
          <PriorityBadge priority={ticket.priority} size="sm" />
        </div>

        <Link
          to={`/tickets/${ticket.id}`}
          onClick={(e) => e.stopPropagation()}
          className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <h3 className="text-sm font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-snug">
            {ticket.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <StatusBadge status={ticket.status} size="sm" />
          </div>

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
            className="h-8 px-2 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 flex items-center cursor-pointer shrink-0"
          >
            <span>{isExpanded ? 'Ocultar' : 'Ver detalles'}</span>
            <ChevronDown
              className={cn('size-3.5 transition-transform duration-200', isExpanded && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            className="overflow-hidden pt-3 mt-2.5 border-t border-dashed border-border text-xs space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-2 text-muted-foreground bg-surface-subtle p-2.5 rounded-lg">
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-muted-foreground">
                  ID Ticket
                </span>
                <span className="font-mono text-xs font-bold text-foreground">#{ticket.id}</span>
              </div>
              <div>
                <span className="font-semibold block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Tipo
                </span>
                <span className="text-xs text-foreground font-medium">
                  {ticket.typeLabel || typeLabel(ticket.type)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
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
