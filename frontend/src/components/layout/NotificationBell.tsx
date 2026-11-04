import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Bell, CheckCheck, Clock, RefreshCw, TicketCheck, UserCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useIsSessionValid } from '@/hooks/useSessionValidity'
import { formatRelative } from '@/lib/format'

interface Notification {
  id: number
  title: string
  body: string
  message: string
  read: boolean
  isRead: boolean
  createdAt: string
  type: string
  ticketId: number | null
}

/**
 * NotificationBell — campana de notificaciones unificada con Web Notifications API (H-42 / H-44 / H-46).
 *
 * - Badge con contador animado (scale pulse en cambio de valor, respetando reduced motion).
 * - Dropdown origin-aware (`absolute right-0 top-full mt-2 max-h-80 overflow-y-auto z-50`).
 * - El permiso y los avisos nativos se coordinan desde el layout autenticado.
 */
export interface NotificationBellProps {
  'data-testid'?: string
  className?: string
}

export function NotificationBell({
  'data-testid': testId = 'notification-bell',
  className,
}: NotificationBellProps = {}) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [pulseBadge, setPulseBadge] = useState(false)
  const prevCountRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()
  const queryClient = useQueryClient()
  const sessionValid = useIsSessionValid()

  // Cerrar al hacer clic fuera del contenedor
  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [open])

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
        return data.count ?? 0
      } catch {
        return 0
      }
    },
    enabled: sessionValid,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

  useEffect(() => {
    if (unreadCount !== prevCountRef.current && unreadCount > 0) {
      setPulseBadge(true)
      const timer = window.setTimeout(() => setPulseBadge(false), 260)
      prevCountRef.current = unreadCount
      return () => window.clearTimeout(timer)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount])

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<Notification[]>('/notifications')
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    },
    enabled: open && sessionValid,
    refetchOnWindowFocus: true,
  })

  // Deduplicación de notificaciones por ID
  const uniqueNotifications = useMemo(() => {
    const seen = new Set<number>()
    const result: Notification[] = []
    for (const item of notifications) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
    return result
  }, [notifications])

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.put(`/notifications/${id}/read`)
      return id
    },
    onSuccess: (id) => {
      queryClient.setQueryData<Notification[]>(['notifications', 'list'], (prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n)),
      )
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  useRealtimeTicketHub({
    onNotificationReceived: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      void refetchNotifications()
    },
  })

  const handleToggle = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen) {
      void refetchNotifications()
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && !notification.isRead) {
      markAsReadMutation.mutate(notification.id)
    }
    setOpen(false)
    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TicketAssigned':
      case 'TicketClaimed':
        return <UserCheck className="size-4 text-blue-600 dark:text-blue-400" />
      case 'TicketPending':
        return <Clock className="size-4 text-amber-600 dark:text-amber-400" />
      case 'TicketResolved':
      case 'TicketSolved':
        return <TicketCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
      case 'TicketReopened':
        return <RefreshCw className="size-4 text-indigo-600 dark:text-indigo-400" />
      default:
        return <Bell className="size-4 text-muted-foreground" />
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        aria-label="Notificaciones"
        data-testid={testId}
        className="relative h-9 w-9 p-0 rounded-lg"
      >
        <Bell className="size-4 text-foreground/85" aria-hidden="true" />
        {unreadCount > 0 && (
          <motion.span
            key={unreadCount}
            data-testid="notification-badge"
            initial={
              prefersReduced
                ? false
                : { transform: 'scale(0.85)', opacity: 0.9 }
            }
            animate={{
              transform:
                !prefersReduced && pulseBadge ? 'scale(1.18)' : 'scale(1)',
              opacity: 1,
            }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.18, ease: [0.23, 1, 0.32, 1] }
            }
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white tabular-nums shadow-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="notification-panel"
            initial={
              prefersReduced
                ? false
                : { opacity: 0, transform: 'scale(0.96) translateY(-4px)' }
            }
            animate={{ opacity: 1, transform: 'scale(1) translateY(0px)' }}
            exit={
              prefersReduced
                ? undefined
                : { opacity: 0, transform: 'scale(0.97) translateY(-4px)' }
            }
            transition={
              prefersReduced
                ? { duration: 0 }
                : { duration: 0.16, ease: [0.23, 1, 0.32, 1] }
            }
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] max-h-96 overflow-y-auto custom-scrollbar origin-top-right rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md text-card-foreground shadow-2xl z-50"
          >
            <div className="p-3 border-b border-border/50 flex items-center justify-between bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-6 px-2 gap-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
                    onClick={async () => {
                      try {
                        await apiClient.put('/notifications/read-all')
                        void queryClient.invalidateQueries({ queryKey: ['notifications'] })
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    <CheckCheck className="size-3" />
                    Marcar leídas
                  </Button>
                )}
              </div>
            </div>
            {uniqueNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto size-6 text-muted-foreground/40 mb-1.5" />
                <p className="text-xs text-muted-foreground">Sin notificaciones recientes.</p>
              </div>
            ) : (
              <ul className="p-2 space-y-1.5 list-none border-0 divide-none">
                {uniqueNotifications.map((n) => {
                  const isUnread = !n.read && !n.isRead
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        'text-sm transition-all duration-150 rounded-xl border-0 overflow-hidden',
                        isUnread
                          ? 'bg-muted/70 dark:bg-muted/40 hover:bg-muted/90 shadow-xs'
                          : 'bg-transparent hover:bg-muted/30 opacity-80 hover:opacity-100',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className="flex w-full items-start gap-2.5 p-2.5 text-left cursor-pointer rounded-xl border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      >
                        <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
                          {getNotificationIcon(n.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("text-xs truncate", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>
                              {n.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                              {formatRelative(n.createdAt)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body || n.message}
                          </p>
                          {n.ticketId && (
                            <p className="text-[10px] text-primary/90 mt-1 font-semibold font-mono">
                              Ticket #{n.ticketId}
                            </p>
                          )}
                        </div>
                        {isUnread && (
                          <span
                            className="flex-shrink-0 size-2 rounded-full bg-primary mt-1.5 ring-2 ring-primary/20"
                            aria-label="No leída"
                          />
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
