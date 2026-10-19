import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

export interface KanbanColumnTab {
  id: string
  title: string
  count: number
  hasNew?: boolean
}

interface KanbanSegmentedTabsProps {
  columns: KanbanColumnTab[]
  activeId: string
  onSelect: (id: string) => void
}

export function KanbanSegmentedTabs({
  columns,
  activeId,
  onSelect,
}: KanbanSegmentedTabsProps) {
  const shouldReduceMotion = useReducedMotion()
  return (
    <div
      role="tablist"
      aria-label="Columnas del Kanban"
      className="flex gap-1.5 overflow-x-auto p-1 bg-muted/60 rounded-xl border border-border/60 scrollbar-none snap-x"
    >
      {columns.map((col) => {
        const isActive = activeId === col.id

        return (
          <button
            key={col.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            data-testid={`kanban-tab-${col.id}`}
            onClick={() => onSelect(col.id)}
            className={cn(
              'relative flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap min-h-[44px] transition-colors select-none snap-start shrink-0 cursor-pointer',
              isActive
                ? 'text-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
            )}
          >
            {isActive && (
              <motion.div
                layoutId="kanban-segment-active"
                className="absolute inset-0 bg-card rounded-lg border border-border shadow-xs"
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 350, damping: 30 }
                }
              />
            )}

            <span className="relative z-10">{col.title}</span>

            {/* Badge con contador */}
            <span
              className={cn(
                'relative z-10 flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] rounded-full font-bold transition-transform',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {col.hasNew && !isActive ? (
                shouldReduceMotion ? (
                  <span>{col.count}</span>
                ) : (
                  <motion.span
                    animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="inline-block"
                  >
                    {col.count}
                  </motion.span>
                )
              ) : (
                col.count
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
