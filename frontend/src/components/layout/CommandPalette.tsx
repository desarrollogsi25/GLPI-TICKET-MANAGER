import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  BarChart3,
  Briefcase,
  HelpCircle,
  Inbox,
  KanbanSquare,
  ListTodo,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react'

import { useRole } from '@/hooks/useRole'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleTheme?: () => void
  isDark?: boolean
}

/**
 * Global Command Palette (`cmdk` — H-42):
 * Per Emil Kowalski's animation decision framework (100+ times/day keyboard shortcut),
 * keyboard-initiated command palettes open/close INSTANTLY with zero entrance animation.
 */
export function CommandPalette({
  open,
  onOpenChange,
  onToggleTheme,
  isDark = false,
}: CommandPaletteProps) {
  const navigate = useNavigate()
  const { isAdmin, isSupervisor } = useRole()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      } else if (event.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  const runCommand = (action: () => void) => {
    onOpenChange(false)
    setSearch('')
    action()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-xs pt-[14vh] px-4"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Buscador global y comandos"
        data-testid="command-palette-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
      >
        <Command label="Comandos rápidos" className="flex flex-col">
          <div className="flex items-center border-b border-border px-3.5">
            <Search className="mr-2.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar vista, ticket o acción rápida..."
              data-testid="command-palette-input"
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-sm">
            <Command.Empty className="py-6 text-center text-xs text-muted-foreground">
              No se encontraron resultados.
            </Command.Empty>

            <Command.Group
              heading="Navegación"
              className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <Command.Item
                onSelect={() => runCommand(() => navigate('/kanban'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <KanbanSquare className="size-4 text-muted-foreground" />
                <span>Tablero Kanban</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/queue'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Inbox className="size-4 text-muted-foreground" />
                <span>Cola del Grupo</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/tickets'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <ListTodo className="size-4 text-muted-foreground" />
                <span>Lista de Tickets</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/services'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Briefcase className="size-4 text-muted-foreground" />
                <span>Catálogo de Servicios</span>
              </Command.Item>

              {(isSupervisor || isAdmin) && (
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/equipo'))}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <Users className="size-4 text-muted-foreground" />
                  <span>Mi Equipo (Dashboard de Líder)</span>
                </Command.Item>
              )}

              {isAdmin && (
                <Command.Item
                  onSelect={() => runCommand(() => navigate('/administracion'))}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  <ShieldCheck className="size-4 text-muted-foreground" />
                  <span>Administración Global</span>
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <BarChart3 className="size-4 text-muted-foreground" />
                <span>Métricas y Estadísticas</span>
              </Command.Item>
            </Command.Group>

            <Command.Group
              heading="Preferencias y Ayuda"
              className="mt-2 border-t border-border/60 pt-2 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {onToggleTheme && (
                <Command.Item
                  onSelect={() => runCommand(onToggleTheme)}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
                >
                  {isDark ? (
                    <Sun className="size-4 text-amber-500" />
                  ) : (
                    <Moon className="size-4 text-muted-foreground" />
                  )}
                  <span>Cambiar a modo {isDark ? 'claro' : 'oscuro'}</span>
                </Command.Item>
              )}

              <Command.Item
                onSelect={() => runCommand(() => navigate('/preferences'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <Settings className="size-4 text-muted-foreground" />
                <span>Preferencias de cuenta</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/ayuda'))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground aria-selected:bg-accent aria-selected:text-accent-foreground"
              >
                <HelpCircle className="size-4 text-muted-foreground" />
                <span>Guía de Agente</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
