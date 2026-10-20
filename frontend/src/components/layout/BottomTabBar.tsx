import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { NavLink, useLocation } from 'react-router-dom'
import { useGroupsQuery } from '@/hooks/useTickets'
import { queryKeys } from '@/lib/api/queryKeys'
import type { PagedResult, TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface BottomTabBarProps {
  onOpenDrawer: () => void
  isDrawerOpen?: boolean
}

export function BottomTabBar({ onOpenDrawer, isDrawerOpen }: BottomTabBarProps) {
  const location = useLocation()
  const path = location.pathname

  const queryClient = useQueryClient()
  const groupsQuery = useGroupsQuery()
  const currentGroupId =
    groupsQuery.data && groupsQuery.data.length > 0 ? groupsQuery.data[0].id : null
  const cachedQueue = currentGroupId
    ? queryClient.getQueryData<PagedResult<TicketSummary>>(queryKeys.tickets.byGroupQueue(currentGroupId))
    : null
  const queueCount = cachedQueue?.total ?? cachedQueue?.items?.length ?? 0

  const isKanbanActive = path === '/kanban' || path === '/'
  const isTicketsActive = path.startsWith('/tickets') && path !== '/tickets/group-queue'
  const isQueueActive = path === '/queue' || path === '/tickets/group-queue'

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg select-none"
    >
      <div className="grid h-14 grid-cols-4">
        {/* Tab 1: Kanban */}
        <NavLink
          to="/kanban"
          aria-label="Tablero Kanban"
          data-testid="mobile-tab-kanban"
          aria-current={isKanbanActive && !isDrawerOpen ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-1 transition-colors active:scale-95 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            isKanbanActive && !isDrawerOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {isKanbanActive && !isDrawerOpen && (
            <motion.div
              layoutId="mobile-tab-active"
              className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex flex-col items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isKanbanActive && !isDrawerOpen ? '2.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <span>Kanban</span>
          </span>
        </NavLink>

        {/* Tab 2: Tickets */}
        <NavLink
          to="/tickets"
          aria-label="Lista de Tickets"
          data-testid="mobile-tab-tickets"
          aria-current={isTicketsActive && !isDrawerOpen ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-1 transition-colors active:scale-95 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            isTicketsActive && !isDrawerOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {isTicketsActive && !isDrawerOpen && (
            <motion.div
              layoutId="mobile-tab-active"
              className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex flex-col items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isTicketsActive && !isDrawerOpen ? '2.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>Tickets</span>
          </span>
        </NavLink>

        {/* Tab 3: Cola */}
        <NavLink
          to="/queue"
          aria-label="Cola del grupo"
          data-testid="mobile-tab-queue"
          aria-current={isQueueActive && !isDrawerOpen ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-1 transition-colors active:scale-95 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            isQueueActive && !isDrawerOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {isQueueActive && !isDrawerOpen && (
            <motion.div
              layoutId="mobile-tab-active"
              className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex flex-col items-center gap-1">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={isQueueActive && !isDrawerOpen ? '2.5' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              {queueCount > 0 && (
                <span
                  data-testid="bottom-tab-queue-badge"
                  className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none"
                >
                  {queueCount}
                </span>
              )}
            </div>
            <span>Cola</span>
          </span>
        </NavLink>

        {/* Tab 4: Más (Drawer) */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Abrir menú más opciones"
          data-testid="mobile-tab-more"
          aria-expanded={isDrawerOpen}
          aria-current={isDrawerOpen ? 'page' : undefined}
          className={cn(
            'relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-1 transition-colors active:scale-95 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
            isDrawerOpen
              ? 'text-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {isDrawerOpen && (
            <motion.div
              layoutId="mobile-tab-active"
              className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex flex-col items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={isDrawerOpen ? '2.5' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span>Más</span>
          </span>
        </button>
      </div>
    </nav>
  )
}
