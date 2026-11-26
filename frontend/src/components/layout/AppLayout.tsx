import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronRight, HelpCircle, LogOut, Moon, Search, Settings, Sun } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { roleLabel } from '@/features/tickets/labels'
import { useCurrentUserQuery, useLogout } from '@/hooks/useAuth'
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const navigate = useNavigate()
  const logout = useLogout()

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
  const { role, isRequester } = useRole()
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
  const username = profile?.username ? `@${profile.username}` : ''

  useEffect(() => {
    const syncDark = () => setIsDark(document.documentElement.classList.contains('dark'))
    syncDark()
    document.documentElement.setAttribute('data-dark-preset', darkPreset)
    const observer = new MutationObserver(syncDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [darkPreset])

  useEffect(() => {
    if (!isUserMenuOpen) return
    const handleMouseDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isUserMenuOpen])

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
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:font-medium focus:text-sm"
      >
        Saltar al contenido
      </a>

      {/* 1. Desktop macOS-inspired Seamless Sidebar (md:+) */}
      <AppSidebar
        connectionState={connectionState}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* 2. Mobile Minimalist Header (<md) */}
      <header className="sticky top-0 z-30 flex md:hidden items-center justify-between bg-background/90 backdrop-blur-md px-4 py-2.5 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/isotipo-gsi.png"
            alt="GSI Service Desk"
            width="32"
            height="32"
            className="size-8 shrink-0 rounded-xl bg-white p-0.5 shadow-[0_1px_3px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.05]"
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
            className="size-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <Search className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleToggleTheme}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            className="size-10 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
          </Button>
          <NotificationBell data-testid="notification-bell-mobile" />
        </div>
      </header>

      <nav
        aria-label="Breadcrumb global"
        className="flex md:hidden items-center gap-1.5 px-4 pb-1 pt-0.5 text-xs text-muted-foreground"
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

      {/* 3. Desktop Borderless Toolbar + Workspace Canvas */}
      <div
        className={cn(
          'min-h-screen md:h-screen flex flex-col transition-[margin-left] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] md:overflow-hidden',
          isSidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-60',
        )}
      >
        {/* Minimalist Borderless macOS Toolbar */}
        <header
          data-testid="desktop-top-header"
          className="sticky top-0 z-20 hidden md:flex h-14 shrink-0 items-center justify-between bg-background/85 backdrop-blur-md px-6"
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

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center rounded-full bg-card/90 px-2.5 py-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04] dark:ring-white/[0.07]">
              <ConnectionIndicator state={connectionState} showLabel />
            </div>

            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              data-testid="command-palette-trigger"
              aria-label="Abrir buscador global"
              className="inline-flex h-8 w-56 items-center justify-between rounded-full bg-card px-3 text-xs text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.06] dark:ring-white/[0.08] hover:text-foreground hover:ring-black/[0.12] dark:hover:ring-white/[0.14] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Buscar ticket o vista…</span>
              </span>
              <kbd className="inline-flex h-5 items-center rounded-full bg-surface-subtle px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleTheme}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              data-testid="theme-toggle-btn"
              className="size-8 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer"
            >
              {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4" />}
            </Button>

            <NotificationBell />

            {/* Compact Floating User Avatar Menu */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-label="Menú de usuario"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                data-testid="header-user-menu-btn"
                className="flex items-center rounded-full p-0.5 transition-transform duration-150 active:scale-95 cursor-pointer hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Avatar name={displayName} size="sm" className="pointer-events-none" />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    role="menu"
                    aria-label="Opciones de cuenta"
                    data-testid="header-user-menu"
                    initial={prefersReduced ? false : { opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={prefersReduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                    transition={
                      prefersReduced
                        ? { duration: 0 }
                        : { type: 'spring', bounce: 0, duration: 0.18 }
                    }
                    className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl bg-popover p-1.5 text-popover-foreground shadow-[0_16px_40px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.06] dark:ring-white/[0.1]"
                  >
                    <div className="px-3 py-2.5">
                      <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {roleLabel(role)} {username ? `· ${username}` : ''}
                      </p>
                    </div>
                    <div className="space-y-0.5 pt-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/preferences')
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        <Settings className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>Preferencias</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          navigate('/ayuda')
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        <span>Ayuda y guía</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          logout()
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="size-3.5" aria-hidden="true" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col min-h-0 w-full max-w-[1440px] mx-auto px-4 md:px-6 pt-2 pb-20 md:pb-5 overflow-hidden focus:outline-none"
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
