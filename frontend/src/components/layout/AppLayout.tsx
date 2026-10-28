import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, Moon, Palette, Search, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownSelect, type DropdownOption } from '@/components/ui/dropdown-select'
import { useCurrentUserQuery } from '@/hooks/useAuth'
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

export type DarkPreset = 'midnight' | 'charcoal' | 'deep-blue'

const presetDot = (color: string) => (
  <span className="size-2.5 rounded-full shrink-0 border border-border/60" style={{ backgroundColor: color }} />
)

const PRESET_OPTIONS: DropdownOption[] = [
  { value: 'midnight', label: 'Umber / Ámbar', icon: presetDot('#0F172A') },
  { value: 'charcoal', label: 'Carbón', icon: presetDot('#1C1917') },
  { value: 'deep-blue', label: 'Azul profundo', icon: presetDot('#0B1329') },
]

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
      return saved && ['midnight', 'charcoal', 'deep-blue'].includes(saved) ? saved : 'midnight'
    } catch {
      return 'midnight'
    }
  })

  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)
  const { connectionState } = useRealtimeTicketHub()
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

      {/* 2. Mobile Header (<md): Logo + User Status + Search + Notification Bell */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between border-b border-border/40 bg-card/85 backdrop-blur-xl px-4 py-2.5 pt-[env(safe-area-inset-top)] shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/isotipo-gsi.png" alt="GSI Service Desk" width="32" height="32" className="size-8 shrink-0 rounded-lg bg-white p-0.5 shadow-xs ring-1 ring-black/5" />
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
            className="size-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <Search className="size-4" />
          </Button>
          <NotificationBell data-testid="notification-bell-mobile" />
        </div>
      </header>

      {/* 3. Desktop Top Header + Main Content Area */}
      <div
        className={cn(
          'min-h-screen md:h-screen flex flex-col transition-[margin-left] duration-300 ease-in-out md:overflow-hidden',
          isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56',
        )}
      >
        {/* Global Desktop Header with Contextual Breadcrumb, Command Palette Trigger, Theme Toggle & Notifications */}
        <header
          data-testid="desktop-top-header"
          className="sticky top-0 z-20 hidden md:flex h-14 shrink-0 items-center justify-between border-none bg-background/60 backdrop-blur-md px-6 shadow-xs"
        >
          {/* Contextual Breadcrumb (sin duplicar el H1 de la página) */}
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
              className="inline-flex h-8 w-56 items-center justify-between rounded-full border-0 bg-muted/50 px-3 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors duration-150 cursor-pointer shadow-xs"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Buscar o saltar a...</span>
              </span>
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded-full border-0 bg-background/80 px-2 font-mono text-[10px] font-medium text-muted-foreground shadow-xs">
                Ctrl K
              </kbd>
            </button>

            {/* Pill Container for Quick Actions */}
            <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1 shadow-xs">
              {isDark && (
                <div className="flex items-center gap-1 rounded-full bg-background/60 backdrop-blur-md pl-2.5 h-7 border border-border/40 shadow-xs">
                  <Palette className="size-3 text-primary shrink-0" aria-hidden="true" />
                  <DropdownSelect
                    aria-label="Preset de modo oscuro"
                    data-testid="dark-preset-select"
                    value={darkPreset}
                    onChange={(v) => handlePresetChange(v as DarkPreset)}
                    options={PRESET_OPTIONS}
                    className="h-7 w-auto border-0 bg-transparent px-2 py-0 text-[11px] font-medium shadow-none rounded-full hover:bg-primary/10"
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleTheme}
                aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
                data-testid="theme-toggle-btn"
                className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
              >
                {isDark ? <Sun className="size-3.5 text-amber-500" /> : <Moon className="size-3.5" />}
              </Button>

              <NotificationBell />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col min-h-0 w-full max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 pb-20 md:pb-4 overflow-hidden focus:outline-none"
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
