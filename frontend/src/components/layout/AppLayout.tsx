import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, LogOut, Menu, Moon, Palette, Search, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogout } from '@/hooks/useAuth'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { AppSidebar } from './AppSidebar'
import { BottomTabBar } from './BottomTabBar'
import { CommandPalette } from './CommandPalette'
import { ConnectionIndicator } from './ConnectionIndicator'
import { MobileDrawer } from './MobileDrawer'
import { NotificationBell } from './NotificationBell'
import { PageTransition } from './PageTransition'

export type DarkPreset = 'warm-minimal' | 'midnight' | 'charcoal' | 'deep-blue'

const ROUTE_LABELS: Record<string, string> = {
  kanban: 'Kanban',
  tickets: 'Tickets',
  queue: 'Cola del Grupo',
  services: 'Servicios',
  equipo: 'Mi Equipo',
  administracion: 'Administración',
  dashboard: 'Dashboard',
  preferences: 'Preferencias',
  ayuda: 'Guía de Agente',
}

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
  const [darkPreset, setDarkPreset] = useState<DarkPreset>(() => {
    try {
      const saved = localStorage.getItem('glpi_dark_preset') as DarkPreset | null
      return saved && ['warm-minimal', 'midnight', 'charcoal', 'deep-blue'].includes(saved)
        ? saved
        : 'warm-minimal'
    } catch {
      return 'warm-minimal'
    }
  })

  const location = useLocation()
  const { connectionState } = useRealtimeTicketHub()
  const logout = useLogout()
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

  const handlePresetChange = (preset: DarkPreset) => {
    setDarkPreset(preset)
    document.documentElement.setAttribute('data-dark-preset', preset)
    try {
      localStorage.setItem('glpi_dark_preset', preset)
    } catch {
      // ignore
    }
  }

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const primarySegment = pathSegments[0] ?? 'kanban'
  const currentRouteLabel = ROUTE_LABELS[primarySegment] ?? primarySegment

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Skip to main content link for keyboard / screen-reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:font-medium focus:text-sm"
      >
        Saltar al contenido
      </a>

      {/* 1. Desktop Sidebar (md:+), collapsible with 200ms ease-out */}
      <AppSidebar
        connectionState={connectionState}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* 2. Desktop Top Header + Main Content Area */}
      <div
        className={cn(
          'min-h-screen flex flex-col transition-all duration-200 ease-out',
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56',
        )}
      >
        {/* Global Desktop Header with Dynamic Breadcrumb, Command Palette Trigger, Theme Toggle & Notifications */}
        <header
          data-testid="desktop-top-header"
          className="sticky top-0 z-20 hidden md:flex h-14 items-center justify-between bg-background/80 backdrop-blur-xl px-6 shadow-xs"
        >
          {/* Dynamic Breadcrumb */}
          <nav
            aria-label="Breadcrumb global"
            data-testid="header-breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link
              to="/kanban"
              className="font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Workspace
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
            <span className="font-semibold text-foreground">{currentRouteLabel}</span>
            {pathSegments[1] && (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground/50" aria-hidden="true" />
                <span className="font-mono text-xs text-primary font-semibold">
                  #{pathSegments[1]}
                </span>
              </>
            )}
          </nav>

          {/* Right: Global Command Search (Ctrl+K) + Dark Preset + Theme Toggle + Notifications */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              data-testid="command-palette-trigger"
              aria-label="Abrir buscador global"
              className="inline-flex h-8 w-56 items-center justify-between rounded-xl bg-muted/40 px-3 text-xs text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Buscar o saltar a...</span>
              </span>
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded-md bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-xs">
                Ctrl K
              </kbd>
            </button>

            {isDark && (
              <div className="flex items-center gap-1 rounded-xl bg-muted/40 px-2 h-8 shadow-xs">
                <Palette className="size-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                <select
                  aria-label="Preset de modo oscuro"
                  data-testid="dark-preset-select"
                  value={darkPreset}
                  onChange={(e) => handlePresetChange(e.target.value as DarkPreset)}
                  className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer pr-1"
                >
                  <option value="warm-minimal" className="bg-popover text-popover-foreground">
                    Cálido / Linen (#1a1714)
                  </option>
                  <option value="midnight" className="bg-popover text-popover-foreground">
                    Noche (#020617)
                  </option>
                  <option value="charcoal" className="bg-popover text-popover-foreground">
                    Carbón (#0c0a09)
                  </option>
                  <option value="deep-blue" className="bg-popover text-popover-foreground">
                    Azul profundo (#030712)
                  </option>
                </select>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTheme}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              data-testid="theme-toggle-btn"
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40"
            >
              {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
            </Button>

            <NotificationBell />
          </div>
        </header>

        {/* 3. Mobile Header (<md): Hamburger + User Name + Notification Bell + Theme + Logout */}
        <header className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-card/85 backdrop-blur-xl px-3.5 py-2.5 pt-[env(safe-area-inset-top)] shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Abrir menú"
              data-testid="mobile-hamburger-btn"
              className="flex h-10 w-10 items-center justify-center p-0 rounded-lg hover:bg-accent text-foreground cursor-pointer shrink-0"
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  data-testid="mobile-header-username"
                  className="text-xs font-semibold text-foreground truncate max-w-[130px]"
                >
                  {displayName}
                </span>
                <ConnectionIndicator state={connectionState} />
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{currentRouteLabel}</p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Buscar comando"
              data-testid="mobile-search-btn"
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTheme}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              data-testid="theme-toggle-mobile"
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
            </Button>
            <NotificationBell />
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              data-testid="logout-btn"
              className="flex items-center gap-1 h-9 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          <div className="mx-auto max-w-[1600px] w-full px-3.5 sm:px-5 md:px-6 py-4 md:py-5 pb-24 md:pb-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
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
