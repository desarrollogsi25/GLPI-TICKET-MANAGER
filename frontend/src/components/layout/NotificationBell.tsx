import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Bell, BellRing, CheckCheck, Clock, RefreshCw, TicketCheck, UserCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'
import { useIsSessionValid } from '@/hooks/useSessionValidity'
import { formatRelative } from '@/lib/format'
import { useToastStore } from '@/store/toastStore'

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
 * - Botón "Activar notificaciones" para Push/Web Notifications nativas del navegador.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [pulseBadge, setPulseBadge] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const prevCountRef = useRef<number>(0)
  const prefersReduced = useReducedMotion()
  const queryClient = useQueryClient()
  const sessionValid = useIsSessionValid()
  const pushToast = useToastStore((s) => s.push)

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

  // Web Notification trigger upon real-time event
  const showNativeNotification = (title: string, body: string, ticketId?: number | null) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            void reg.showNotification(title, {
              body,
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              data: { url: ticketId ? `/tickets/${ticketId}` : '/kanban' },
            })
          })
        } else {
          new Notification(title, {
            body,
            icon: '/icons/icon-192x192.png',
          })
        }
      } catch {
        // Fallback handled smoothly
      }
    }
  }

  useRealtimeTicketHub({
    onNotificationReceived: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      showNativeNotification('GLPI Ticket Manager', 'Tienes una nueva notificación en el sistema')
    },
    onTicketCreated: (ticketId) => {
      showNativeNotification('Nuevo Ticket Creado', `Se ha generado el ticket #${ticketId} en tu grupo`, ticketId)
    },
    onTicketStatusChanged: (ticketId) => {
      showNativeNotification('Estado Actualizado', `El ticket #${ticketId} ha cambiado de estado`, ticketId)
    },
  })

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      pushToast({
        title: 'No soportado',
        description: 'Tu navegador no soporta notificaciones de escritorio.',
        variant: 'destructive',
      })
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      if (permission === 'granted') {
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready
            if (reg.pushManager) {
              const existingSub = await reg.pushManager.getSubscription()
              if (!existingSub) {
                // Registro local o envío de endpoint si existe VAPID
              }
            }
          } catch {
            // Fallback graceful
          }
        }
        pushToast({
          title: 'Notificaciones activadas',
          description: 'Recibirás avisos nativos en tiempo real.',
          variant: 'success',
        })
        showNativeNotification('GLPI Ticket Manager', '¡Notificaciones nativas configuradas con éxito!')
      } else if (permission === 'denied') {
        pushToast({
          title: 'Permiso denegado',
          description: 'Habilita los permisos de notificación desde la configuración de tu navegador.',
          variant: 'destructive',
        })
      }
    } catch {
      // ignore
    }
  }

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
  }

  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'TicketAssigned':
      case 'TicketClaimed':
        return 'border-l-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
      case 'TicketPending':
        return 'border-l-2 border-amber-500 bg-amber-50/40 dark:bg-amber-950/30'
      case 'TicketResolved':
      case 'TicketSolved':
        return 'border-l-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
      case 'TicketReopened':
        return 'border-l-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30'
      default:
        return 'border-l-2 border-slate-400 bg-muted/20'
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
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        aria-label="Notificaciones"
        data-testid="notification-bell"
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
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white tabular-nums shadow-xs"
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
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] max-h-80 overflow-y-auto origin-top-right rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-50"
          >
            <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20 sticky top-0 z-10 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Notificaciones
                </h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {pushPermission !== 'granted' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-6 px-1.5 gap-1 text-primary hover:text-primary/80"
                    onClick={requestNotificationPermission}
                    title="Activar notificaciones nativas"
                    data-testid="enable-push-btn"
                  >
                    <BellRing className="size-3" />
                    <span>Activar Push</span>
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[11px] h-6 px-2 gap-1 text-muted-foreground hover:text-foreground"
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
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto size-6 text-muted-foreground/40 mb-1.5" />
                <p className="text-xs text-muted-foreground">Sin notificaciones recientes.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      'p-3 text-sm transition-colors duration-150 cursor-pointer hover:bg-muted/40',
                      !n.read && !n.isRead ? 'bg-primary/5 font-medium' : 'opacity-75',
                      getNotificationTypeClass(n.type),
                    )}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex-shrink-0" aria-hidden="true">
                        {getNotificationIcon(n.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold truncate text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatRelative(n.createdAt)}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body || n.message}
                        </p>
                        {n.ticketId && (
                          <p className="text-[10px] text-primary mt-1 font-semibold font-mono">
                            Ticket #{n.ticketId}
                          </p>
                        )}
                      </div>
                      {!n.read && !n.isRead && (
                        <span
                          className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"
                          aria-label="No leída"
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
