import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/kanban', label: 'Kanban' },
  { to: '/tickets', label: 'Tickets' },
  { to: '/queue', label: 'Cola del grupo' },
  { to: '/dashboard', label: 'Dashboard' },
]

export function AppLayout() {
  const clear = useAuthStore((state) => state.clear)
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const navigate = useNavigate()

  const profile = currentUser ?? storedUser

  const handleLogout = () => {
    clear()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <div className="mb-6 px-2">
          <p className="text-sm font-semibold">GLPI Ticket Manager</p>
          <p className="text-xs text-muted-foreground">Gestión de tickets</p>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <nav className="flex gap-1 md:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-secondary-foreground'
                      : 'text-muted-foreground hover:bg-accent',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">
                {profile?.displayName || profile?.username || 'Sesión'}
              </p>
              <p className="text-xs text-muted-foreground">{profile?.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
