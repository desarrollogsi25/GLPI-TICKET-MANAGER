import { motion, useReducedMotion } from 'motion/react'
import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  ChevronLeft,
  ChevronRight,
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
import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogout } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useGroupsQuery } from '@/hooks/useTickets'
import { queryKeys } from '@/lib/api/queryKeys'
import type { PagedResult, TicketSummary } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { ConnectionIndicator } from './ConnectionIndicator'
import { NotificationBell } from './NotificationBell'
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
    icon: (active) => <KanbanSquare className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'tickets',
    to: '/tickets',
    label: 'Tickets',
    icon: (active) => <ListTodo className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'queue',
    to: '/queue',
    label: 'Cola',
    isQueue: true,
    icon: (active) => <Inbox className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'services',
    to: '/services',
    label: 'Servicios',
    icon: (active) => <Briefcase className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
]

const secondaryNav: NavItemConfig[] = [
  {
    id: 'equipo',
    to: '/equipo',
    label: 'Mi Equipo',
    supervisorOrAdmin: true,
    icon: (active) => <Users className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'administracion',
    to: '/administracion',
    label: 'Administración',
    adminOnly: true,
    icon: (active) => <ShieldCheck className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    icon: (active) => <BarChart3 className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'ayuda',
    to: '/ayuda',
    label: 'Ayuda',
    icon: (active) => <HelpCircle className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
  {
    id: 'preferences',
    to: '/preferences',
    label: 'Preferencias',
    icon: (active) => <Settings className={cn('size-4', active ? 'stroke-[2.25]' : 'stroke-2')} />,
  },
]

interface AppSidebarProps {
  connectionState?: ConnectionState
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function AppSidebar({
  connectionState = 'disconnected',
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const prefersReduced = useReducedMotion()
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const logout = useLogout()

  const profile = currentUser ?? storedUser
  const displayName = profile?.displayName || profile?.username || 'Usuario'
  const username = profile?.username ? `@${profile.username}` : ''
  const initial = displayName.charAt(0).toUpperCase()

  const { isAdmin, isSupervisor } = useRole()
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
    <ul className="flex flex-col gap-1">
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
                  'group relative flex items-center min-h-[40px] rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/10 border border-primary/15 rounded-lg"
                      transition={
                        prefersReduced
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 32 }
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
                        'relative z-10 flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground leading-none tabular-nums',
                        collapsed
                          ? 'absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px]'
                          : 'ml-auto h-5 min-w-5 px-1.5 text-xs',
                      )}
                    >
                      {queueCount}
                    </span>
                  )}

                  {/* Instant tooltip when sidebar is collapsed */}
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
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-card/95 backdrop-blur-sm md:flex select-none transition-all duration-200 ease-out',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* 1. Header con Logo + Toggle Collapse */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border/60',
          collapsed ? 'justify-center px-2' : 'justify-between px-4',
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
            GL
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-foreground truncate leading-tight">
                GLPI Manager
              </p>
              <p className="text-[11px] text-muted-foreground truncate leading-tight">
                Workspace SaaS
              </p>
            </div>
          )}
        </div>

        {onToggleCollapse && !collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label="Colapsar barra lateral"
            title="Colapsar barra lateral"
            data-testid="sidebar-collapse-btn"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
      </div>

      {onToggleCollapse && collapsed && (
        <div className="flex justify-center border-b border-border/40 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            aria-label="Expandir barra lateral"
            title="Expandir barra lateral"
            data-testid="sidebar-collapse-btn"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* 2. Navegación Principal y Secundaria */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        <div>
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
              Operación
            </p>
          )}
          {renderNavList(primaryNav)}
        </div>

        <div className="border-t border-border/60 pt-3">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
              Gestión y Ajustes
            </p>
          )}
          {renderNavList(secondaryNav)}
        </div>
      </div>

      {/* 3. User Card al pie con Avatar + Logout */}
      <div className="shrink-0 border-t border-border/60 p-2.5 bg-muted/20">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 py-1">
            <div
              title={`${displayName} (${username})`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-xs border border-primary/20"
            >
              {initial}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              data-testid="logout-btn"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold text-xs border border-primary/20">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-semibold leading-tight text-foreground">
                  {displayName}
                </p>
                <ConnectionIndicator state={connectionState} />
              </div>
              {username && (
                <p className="truncate text-[11px] text-muted-foreground">{username}</p>
              )}
            </div>
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              data-testid="logout-btn"
              className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
