import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  HelpCircle,
  Inbox,
  KanbanSquare,
  ListTodo,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { roleLabel } from '@/features/tickets/labels'
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
  supervisorOrAdmin?: boolean
}

const primaryNav: NavItemConfig[] = [
  {
    id: 'kanban',
    to: '/kanban',
    label: 'Kanban',
    icon: (active) => <KanbanSquare className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'tickets',
    to: '/tickets',
    label: 'Tickets',
    icon: (active) => <ListTodo className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'queue',
    to: '/queue',
    label: 'Cola',
    isQueue: true,
    icon: (active) => <Inbox className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'services',
    to: '/services',
    label: 'Servicios',
    icon: (active) => <Briefcase className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
]

const secondaryNav: NavItemConfig[] = [
  {
    id: 'equipo',
    to: '/equipo',
    label: 'Mi Equipo',
    supervisorOrAdmin: true,
    icon: (active) => <Users className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'administracion',
    to: '/administracion',
    label: 'Administración',
    adminOnly: true,
    icon: (active) => <ShieldCheck className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: (active) => <BarChart3 className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'ayuda',
    to: '/ayuda',
    label: 'Ayuda',
    icon: (active) => <HelpCircle className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
  {
    id: 'preferences',
    to: '/preferences',
    label: 'Preferencias',
    icon: (active) => <Settings className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-[1.9]')} />,
  },
]

interface AppSidebarProps {
  connectionState?: ConnectionState
  collapsed?: boolean
}

export function AppSidebar({
  connectionState = 'disconnected',
  collapsed = false,
}: AppSidebarProps) {
  const prefersReduced = useReducedMotion()
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const logout = useLogout()

  const profile = currentUser ?? storedUser
  const displayName = profile?.displayName || profile?.username || 'Usuario'
  const username = profile?.username ? `@${profile.username}` : ''

  const { role, isAdmin, isSupervisor, isRequester } = useRole()
  const visiblePrimaryNav = isRequester
    ? primaryNav
        .filter((item) => item.id === 'tickets')
        .map((item) => ({ ...item, label: 'Mis tickets' }))
    : primaryNav
  const visibleSecondaryNav = isRequester
    ? secondaryNav.filter((item) => item.id === 'ayuda' || item.id === 'preferences')
    : secondaryNav
  const queryClient = useQueryClient()
  const groupsQuery = useGroupsQuery()
  const currentGroupId =
    groupsQuery.data && groupsQuery.data.length > 0 ? groupsQuery.data[0].id : null
  const cachedQueue = currentGroupId
    ? queryClient.getQueryData<PagedResult<TicketSummary>>(
        queryKeys.tickets.byGroupQueue(currentGroupId),
      )
    : null
  const queueCount = cachedQueue?.total ?? cachedQueue?.items?.length ?? 0

  const renderNavList = (items: NavItemConfig[]) => (
    <ul className="flex flex-col gap-0.5">
      {items
        .filter((item) => {
          if (item.adminOnly) return isAdmin
          if (item.supervisorOrAdmin) return isAdmin || isSupervisor
          return true
        })
        .map((item) => (
          <li key={item.id}>
            <NavLink
              to={item.to}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              data-testid={`sidebar-nav-${item.id}`}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center min-h-[38px] rounded-xl text-[13px] font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-card rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { type: 'spring', bounce: 0, duration: 0.26 }
                      }
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 shrink-0 transition-colors duration-150',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {item.icon(isActive)}
                  </span>

                  {!collapsed && <span className="relative z-10 truncate">{item.label}</span>}

                  {item.isQueue && queueCount > 0 && (
                    <span
                      data-testid="sidebar-queue-badge"
                      className={cn(
                        'relative z-10 flex items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground leading-none tabular-nums',
                        collapsed
                          ? 'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]'
                          : 'ml-auto h-5 min-w-5 px-1.5 text-[11px]',
                      )}
                    >
                      {queueCount}
                    </span>
                  )}

                  {collapsed && (
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute left-full ml-2.5 z-50 hidden group-hover:inline-flex items-center rounded-md border border-border bg-popover px-2.5 py-1 text-xs font-medium text-popover-foreground shadow-md whitespace-nowrap"
                    >
                      {item.label}
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
      data-testid="desktop-sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col bg-background md:flex select-none transition-[width] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      {/* 1. Seamless macOS-style Brand Header */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/isotipo-gsi.png"
            alt="GSI Service Desk"
            width="32"
            height="32"
            className="size-8 shrink-0 rounded-xl bg-white p-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.05]"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[13px] font-semibold tracking-[-0.015em] text-foreground truncate leading-tight">
                GSI Service Desk
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                GLPI Ticket Manager
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 2. Role-Aware Seamless Navigation (separated purely by spacing) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 py-3 space-y-6">
        <div>
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Operación
            </p>
          )}
          {renderNavList(visiblePrimaryNav)}
        </div>

        <div>
          {!collapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.06em] uppercase text-muted-foreground">
              Gestión y Ajustes
            </p>
          )}
          {renderNavList(visibleSecondaryNav)}
        </div>
      </div>

      {/* 3. Floating Account Pill with Role Badge + Always-Accessible Logout */}
      <div className="shrink-0 p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-card/85 py-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            <Avatar name={displayName} size="md" title={`${displayName} (${roleLabel(role)})`} />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              data-testid="logout-btn"
              className="size-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        ) : (
          <div
            className="flex items-center justify-between gap-2 rounded-2xl bg-card/90 p-2.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
            title={username ? `${displayName} · ${roleLabel(role)} (${username})` : `${displayName} · ${roleLabel(role)}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name={displayName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-semibold leading-tight text-foreground">
                    {displayName}
                  </p>
                  <ConnectionIndicator state={connectionState} />
                </div>
                <p className="truncate text-[10px] font-medium text-muted-foreground mt-0.5">
                  {roleLabel(role)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              data-testid="logout-btn"
              className="size-8 p-0 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
