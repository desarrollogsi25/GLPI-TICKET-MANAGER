import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useAuth'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { AppSidebar } from './AppSidebar'
import { BottomTabBar } from './BottomTabBar'
import { ConnectionIndicator } from './ConnectionIndicator'
import { MobileDrawer } from './MobileDrawer'
import { PageTransition } from './PageTransition'

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { connectionState } = useRealtimeTicketHub()
  const logout = useLogout()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Skip to main content link for keyboard / screen-reader accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:font-medium focus:text-sm"
      >
        Saltar al contenido
      </a>

      {/* 1. Desktop Sidebar (md:+) */}
      <AppSidebar connectionState={connectionState} />

      {/* 2. Mobile Header (<md) */}
      <header className="flex md:hidden items-center justify-between border-b border-border bg-card px-4 py-3 pt-[env(safe-area-inset-top)]">
        {/* Left: Hamburger Menu Button & Connection */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Abrir menú"
            data-testid="mobile-hamburger-btn"
            className="flex h-9 w-9 items-center justify-center p-0 rounded-lg hover:bg-accent text-foreground cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
          <ConnectionIndicator state={connectionState} />
        </div>

        {/* Right: Quick actions (Logout button) */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            data-testid="logout-btn"
            className="flex items-center gap-1.5 h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
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
            <span className="hidden sm:inline">Cerrar sesión</span>
          </Button>
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main id="main-content" tabIndex={-1} className="md:ml-60 min-h-screen focus:outline-none">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 md:py-6 pb-20 md:pb-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* 4. Mobile Drawer */}
      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* 5. Mobile Bottom Tab Bar */}
      <div className="md:hidden">
        <BottomTabBar onOpenDrawer={() => setIsDrawerOpen(true)} isDrawerOpen={isDrawerOpen} />
      </div>
    </div>
  )
}
