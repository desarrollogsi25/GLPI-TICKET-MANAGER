import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { HelpCircle, Inbox, KanbanSquare, ListTodo, Menu, Settings } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { useRole } from '@/hooks/useRole'
import { useGroupsQuery } from '@/hooks/useTickets'
import { queryKeys } from '@/lib/api/queryKeys'
import type { PagedResult, TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'

interface BottomTabBarProps {
  onOpenDrawer: () => void
  isDrawerOpen?: boolean
}

interface TabItem {
  id: string
  label: string
  testId: string
  icon: React.ReactNode
  active: boolean
  to?: string
  onClick?: () => void
  badge?: number
}

const tabClass = (active: boolean) =>
  cn(
    'relative flex flex-col items-center justify-center min-h-[56px] min-w-[44px] gap-1 transition-colors active:scale-95 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
    active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground',
  )

function ActiveIndicator() {
  return (
    <motion.div
      layoutId="mobile-tab-active"
      className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl"
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
    />
  )
}

export function BottomTabBar({ onOpenDrawer, isDrawerOpen }: BottomTabBarProps) {
  const location = useLocation()
  const path = location.pathname
  const { isRequester } = useRole()

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

  // Requesters cannot use the technician board or queue, so their bar only
  // exposes the screens their role actually authorises.
  const tabs: TabItem[] = isRequester
    ? [
        {
          id: 'tickets',
          to: '/tickets',
          label: 'Mis tickets',
          testId: 'mobile-tab-tickets',
          icon: <ListTodo className="size-5" aria-hidden="true" />,
          active: path.startsWith('/tickets'),
        },
        {
          id: 'ayuda',
          to: '/ayuda',
          label: 'Ayuda',
          testId: 'mobile-tab-help',
          icon: <HelpCircle className="size-5" aria-hidden="true" />,
          active: path.startsWith('/ayuda'),
        },
        {
          id: 'preferences',
          to: '/preferences',
          label: 'Ajustes',
          testId: 'mobile-tab-preferences',
          icon: <Settings className="size-5" aria-hidden="true" />,
          active: path.startsWith('/preferences'),
        },
        {
          id: 'more',
          label: 'Más',
          testId: 'mobile-tab-more',
          icon: <Menu className="size-5" aria-hidden="true" />,
          active: Boolean(isDrawerOpen),
          onClick: onOpenDrawer,
        },
      ]
    : [
        {
          id: 'kanban',
          to: '/kanban',
          label: 'Kanban',
          testId: 'mobile-tab-kanban',
          icon: (
            <KanbanSquare
              className={cn('size-5', isKanbanActive && !isDrawerOpen ? 'stroke-[2.5]' : 'stroke-2')}
              aria-hidden="true"
            />
          ),
          active: isKanbanActive && !isDrawerOpen,
        },
        {
          id: 'tickets',
          to: '/tickets',
          label: 'Tickets',
          testId: 'mobile-tab-tickets',
          icon: <ListTodo className="size-5" aria-hidden="true" />,
          active: isTicketsActive && !isDrawerOpen,
        },
        {
          id: 'queue',
          to: '/queue',
          label: 'Cola',
          testId: 'mobile-tab-queue',
          icon: <Inbox className="size-5" aria-hidden="true" />,
          active: isQueueActive && !isDrawerOpen,
          badge: queueCount,
        },
        {
          id: 'more',
          label: 'Más',
          testId: 'mobile-tab-more',
          icon: <Menu className="size-5" aria-hidden="true" />,
          active: Boolean(isDrawerOpen),
          onClick: onOpenDrawer,
        },
      ]

  return (
    <nav
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden shadow-lg select-none"
    >
      <div className="grid h-14 grid-cols-4">
        {tabs.map((tab) => {
          const content = (
            <>
              {tab.active && <ActiveIndicator />}
              <span className="relative z-10 flex flex-col items-center gap-1">
                <span className="relative">
                  {tab.icon}
                  {tab.badge != null && tab.badge > 0 && (
                    <span
                      data-testid="bottom-tab-queue-badge"
                      className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none"
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </span>
            </>
          )

          return tab.to ? (
            <NavLink
              key={tab.id}
              to={tab.to}
              aria-label={tab.label}
              data-testid={tab.testId}
              aria-current={tab.active ? 'page' : undefined}
              className={tabClass(tab.active)}
            >
              {content}
            </NavLink>
          ) : (
            <button
              key={tab.id}
              type="button"
              onClick={tab.onClick}
              aria-label={tab.id === 'more' ? 'Abrir menú más opciones' : tab.label}
              data-testid={tab.testId}
              aria-expanded={tab.id === 'more' ? isDrawerOpen : undefined}
              aria-current={tab.active ? 'page' : undefined}
              className={tabClass(tab.active)}
            >
              {content}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
