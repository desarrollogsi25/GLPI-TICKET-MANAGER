import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCurrentUserQuery, useLogout } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface DrawerNavItem {
  to: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  supervisorOrAdmin?: boolean
}

const drawerNavItems: DrawerNavItem[] = [
  {
    to: '/kanban',
    label: 'Kanban',
    icon: <KanbanSquare className="size-4" />,
  },
  {
    to: '/queue',
    label: 'Cola del Grupo',
    icon: <Inbox className="size-4" />,
  },
  {
    to: '/tickets',
    label: 'Tickets',
    icon: <ListTodo className="size-4" />,
  },
  {
    to: '/equipo',
    label: 'Mi Equipo',
    supervisorOrAdmin: true,
    icon: <Users className="size-4" />,
  },
  {
    to: '/administracion',
    label: 'Administración',
    adminOnly: true,
    icon: <ShieldCheck className="size-4" />,
  },
  {
    to: '/services',
    label: 'Servicios',
    icon: <Briefcase className="size-4" />,
  },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: <BarChart3 className="size-4" />,
  },
  {
    to: '/preferences',
    label: 'Preferencias',
    icon: <Settings className="size-4" />,
  },
  {
    to: '/ayuda',
    label: 'Ayuda',
    icon: <HelpCircle className="size-4" />,
  },
]

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const prefersReduced = useReducedMotion()
  const storedUser = useAuthStore((state) => state.user)
  const { data: currentUser } = useCurrentUserQuery()
  const { isAdmin, isSupervisor } = useRole()
  const logout = useLogout()
  const profile = currentUser ?? storedUser
  const drawerRef = useRef<HTMLDivElement>(null)

  const visibleItems = drawerNavItems.filter((item) => {
    if (item.adminOnly) return isAdmin
    if (item.supervisorOrAdmin) return isAdmin || isSupervisor
    return true
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      if (drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusables.length > 0) {
          focusables[0].focus()
        }
      }
    }, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        )
        if (focusables.length === 0) return

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay oscuro de fondo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
            }
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Panel lateral deslizable (Sheet izquierdo con curva iOS drawer) */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú del sistema"
            tabIndex={-1}
            data-testid="mobile-drawer"
            initial={prefersReduced ? false : { transform: 'translateX(-100%)' }}
            animate={{ transform: 'translateX(0%)' }}
            exit={prefersReduced ? undefined : { transform: 'translateX(-100%)' }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.26, ease: [0.32, 0.72, 0, 1] }
            }
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card/95 backdrop-blur-2xl shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] outline-none"
          >
            {/* Header del Drawer */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-xs">
                  GL
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">GLPI Manager</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Menú de navegación</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar menú"
                data-testid="mobile-menu-btn"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-foreground cursor-pointer transition-colors duration-150"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Perfil del Usuario */}
            <div className="p-4 bg-muted/30">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Sesión activa
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {profile?.displayName || profile?.username || 'Sesión activa'}
              </p>
              <p className="text-xs text-muted-foreground truncate">@{profile?.username || 'tech'}</p>
            </div>

            {/* Enlaces de Navegación */}
            <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors duration-150 min-h-[44px]',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-accent/40 hover:text-accent-foreground',
                    )
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Footer con Botón Logout */}
            <div className="p-4 bg-muted/20">
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  onClose()
                  logout()
                }}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                data-testid="logout-btn"
                className="w-full flex items-center justify-center gap-2 min-h-[44px] text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
