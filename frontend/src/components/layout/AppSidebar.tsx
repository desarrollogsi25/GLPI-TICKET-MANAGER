import { motion } from 'motion/react'
import { NavLink } from 'react-router-dom'

import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogout } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useGroupsQuery } from '@/hooks/useTickets'
import { queryKeys } from '@/lib/api/queryKeys'
import type { PagedResult, TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { ConnectionIndicator } from './ConnectionIndicator'
import type { ConnectionState } from '@/hooks/useRealtimeTicketHub'

interface NavItemConfig {
  id: string
  to: string
  label: string
  icon: (active: boolean) => React.ReactNode
  isQueue?: boolean
  adminOnly?: boolean
}

const primaryNav: NavItemConfig[] = [
  {
    id: 'kanban',
    to: '/kanban',
    label: 'Kanban',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    id: 'tickets',
    to: '/tickets',
    label: 'Tickets',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
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
    ),
  },
  {
    id: 'queue',
    to: '/queue',
    label: 'Cola',
    isQueue: true,
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
      </svg>
    ),
  },
  {
    id: 'services',
    to: '/services',
    label: 'Servicios',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
]

const secondaryNav: NavItemConfig[] = [
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'ayuda',
    to: '/ayuda',
    label: 'Ayuda',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'preferences',
    to: '/preferences',
    label: 'Preferencias',
    icon: (active) => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? '2.5' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

interface AppSidebarProps {
  connectionState?: ConnectionState
}

export function AppSidebar({ connectionState = 'disconnected' }: AppSidebarProps) {
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const logout = useLogout()

  const profile = currentUser ?? storedUser
  const displayName = profile?.displayName || profile?.username || 'Usuario'
  const username = profile?.username ? `@${profile.username}` : ''
  const initial = displayName.charAt(0).toUpperCase()

  const { isAdmin, isSolicitante } = useRole()
  const queryClient = useQueryClient()
  const groupsQuery = useGroupsQuery()
  const currentGroupId =
    groupsQuery.data && groupsQuery.data.length > 0 ? groupsQuery.data[0].id : null
  const cachedQueue = currentGroupId
    ? queryClient.getQueryData<PagedResult<TicketSummary>>(queryKeys.tickets.byGroupQueue(currentGroupId))
    : null
  const queueCount = cachedQueue?.total ?? cachedQueue?.items?.length ?? 0

  const renderNavList = (items: NavItemConfig[]) => (
    <ul className="flex flex-col gap-1">
      {items
        .filter((item) => (!item.adminOnly || isAdmin) && (!isSolicitante || item.id === 'tickets' || item.id === 'preferences' || item.id === 'ayuda'))
        .map((item) => (
        <li key={item.id}>
          <NavLink
            to={item.to}
            data-testid={`sidebar-nav-${item.id}`}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-r-lg text-sm font-medium transition-colors border-l-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                isActive
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 rounded-r-lg"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className={cn('relative z-10 shrink-0 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}>
                  {item.icon(isActive)}
                </span>
                <span className="relative z-10 truncate">{item.label}</span>
                {item.isQueue && queueCount > 0 && (
                  <span
                    data-testid="sidebar-queue-badge"
                    className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground leading-none"
                  >
                    {queueCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <aside
      aria-label="Navegación principal desktop"
      className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card md:flex select-none"
    >
      {/* 1. Header con Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-sm">
          GL
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-foreground truncate">
            GLPI Manager
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Gestión de tickets
          </p>
        </div>
      </div>

      {/* 2. Navegación Principal y Secundaria */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3.5 pb-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            Principal
          </p>
          {renderNavList(primaryNav)}
        </div>

        <div className="border-t border-border/60 pt-4">
          <p className="px-3.5 pb-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            Ajustes
          </p>
          {renderNavList(secondaryNav)}
        </div>
      </div>

      {/* 3. User Card al pie con Avatar + Logout */}
      <div className="shrink-0 border-t border-border/60 p-3 bg-muted/20">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-sm border border-primary/20">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium leading-tight text-foreground">
                {displayName}
              </p>
              <ConnectionIndicator state={connectionState} />
            </div>
            {username && (
              <p className="truncate text-xs text-muted-foreground">
                {username}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            data-testid="logout-btn"
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </Button>
        </div>
      </div>
    </aside>
  )
}
