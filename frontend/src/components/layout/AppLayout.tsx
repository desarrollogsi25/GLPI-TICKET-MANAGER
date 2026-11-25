import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, Moon, Search, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery } from '@/hooks/useAuth'
import { showNativeNotification } from '@/hooks/useAutomaticNotificationPermission'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { AppSidebar } from './AppSidebar'
import { BottomTabBar } from './BottomTabBar'
import { CommandPalette } from './CommandPalette'
import { ConnectionIndicator } from './ConnectionIndicator'
import { MobileDrawer } from './MobileDrawer'
import { NotificationBell } from './NotificationBell'
import { PageTransition } from './PageTransition'

export type DarkPreset = 'midnight' | 'charcoal' | 'deep-blue'

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('glpi_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark'),
  )
  const [darkPreset] = useState<DarkPreset>(() => {
    try {
      const saved = localStorage.getItem('glpi_dark_preset') as DarkPreset | null
      return saved && ['midnight', 'charcoal', 'deep-blue'].includes(saved) ? saved : 'midnight'
    } catch {
      return 'midnight'
    }
  })

  const location = useLocation()
  const { isRequester } = useRole()
  const homePath = isRequester ? '/tickets' : '/kanban'
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const routeLabels: Record<string, string> = {
    kanban: 'Kanban',
    queue: 'Cola del grupo',
    tickets: isRequester ? 'Mis tickets' : 'Tickets',
    equipo: 'Mi Equipo',
    dashboard: 'Dashboard',
    administracion: 'Administración',
    preferences: 'Preferencias',
    services: 'Servicios',
    ayuda: 'Ayuda',
  }
  const currentPage = routeLabels[pathSegments[0]] ?? 'Inicio'

  const { connectionState } = useRealtimeTicketHub({
    onNotificationReceived: () => {
      void showNativeNotification('GLPI Ticket Manager', 'Tienes una nueva notificación en el sistema')
    },
    onTicketCreated: (ticketId) => {
      void showNativeNotification('Nuevo Ticket Creado', `Se ha generado el ticket #${ticketId} en tu grupo`, ticketId)
    },
    onTicketStatusChanged: (ticketId) => {
      void showNativeNotification('Estado Actualizado', `El ticket #${ticketId} ha cambiado de estado`, ticketId)
    },
  })
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const profile = currentUser ?? storedUser
  const displayName = profile?.displayName || profile?.username || 'Usuario'

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
    document.documentElement.setAttribute('data-dark-preset', darkPreset)
  }, [darkPreset])

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('glpi_sidebar_collapsed', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleToggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark')
    if (nextDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.setAttribute('data-dark-preset', darkPreset)
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    }
    setIsDark(nextDark)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Skip to main content link for keyboard / screen-reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:font-medium focus:text-sm"
      >
        Saltar al contenido
      </a>

      {/* 1. Desktop Sidebar (md:+) */}
      <AppSidebar
        connectionState={connectionState}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* 2. Mobile Header (<md) */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-2 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/isotipo-gsi.png"
            alt="GSI Service Desk"
            width="32"
            height="32"
            className="size-8 shrink-0 rounded-lg bg-white p-0.5 border border-border/80"
          />
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              data-testid="mobile-header-username"
              className="text-xs font-semibold text-foreground truncate max-w-[140px]"
            >
              {displayName}
            </span>
            <ConnectionIndicator state={connectionState} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCommandOpen(true)}
            aria-label="Buscar comando"
            data-testid="mobile-search-btn"
            className="size-10 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70"
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleToggleTheme}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="size-10 p-0 rounded-lg text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
          </Button>
          <NotificationBell data-testid="notification-bell-mobile" />
        </div>
      </header>

      <nav
        aria-label="Breadcrumb global"
        className="flex md:hidden items-center gap-1.5 border-b border-border bg-surface-subtle px-4 py-2 text-xs text-muted-foreground"
      >
        <Link to={homePath} className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        {pathSegments[1] ? (
          <>
            <Link to={`/${pathSegments[0]}`} className="hover:text-foreground">
              {currentPage}
            </Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span aria-current="page" className="font-semibold text-foreground">
              Detalle
            </span>
          </>
        ) : (
          <span aria-current="page" className="font-medium text-foreground">
            {currentPage}
          </span>
        )}
      </nav>

      {/* 3. Desktop Top Header + Main Content Area */}
      <div
        className={cn(
          'min-h-screen md:h-screen flex flex-col transition-[margin-left] duration-200 ease-out md:overflow-hidden',
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56',
        )}
      >
        {/* Global Desktop Header: Breadcrumb, Realtime Status, Command Search, Theme & Notifications */}
        <header
          data-testid="desktop-top-header"
          className="sticky top-0 z-20 hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6"
        >
          <nav
            aria-label="Breadcrumb global"
            data-testid="header-breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              to={homePath}
              className="font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Inicio
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
            {pathSegments[1] ? (
              <>
                <Link to={`/${pathSegments[0]}`} className="font-medium hover:text-foreground transition-colors">
                  {currentPage}
                </Link>
                <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
                <span aria-current="page" className="font-semibold font-mono text-foreground">
                  #{pathSegments[1]}
                </span>
              </>
            ) : (
              <span aria-current="page" className="font-semibold text-foreground">
                {currentPage}
              </span>
            )}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center rounded-md border border-border bg-surface-subtle px-2.5 py-1">
              <ConnectionIndicator state={connectionState} showLabel />
            </div>

            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              data-testid="command-palette-trigger"
              aria-label="Abrir buscador global"
              className="inline-flex h-8 w-56 items-center justify-between rounded-lg border border-border bg-surface-subtle px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Buscar ticket o vista…</span>
              </span>
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            <div className="flex items-center gap-1 border-l border-border pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleTheme}
                aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                data-testid="theme-toggle-btn"
                className="size-8 p-0 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
              </Button>

              <NotificationBell />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col min-h-0 w-full max-w-[1440px] mx-auto px-4 md:px-6 py-4 pb-20 md:pb-5 overflow-hidden focus:outline-none"
        >
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* 4. Mobile Drawer (Sheet) */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* 5. Mobile Bottom Tab Bar */}
      <div className="md:hidden">
        <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} isDrawerOpen={isDrawerOpen} />
      </div>

      {/* 6. Global Command Palette */}
      <CommandPalette
        open={isCommandOpen}
        onOpenChange={setIsCommandOpen}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
      />
    </div>
  )
}
