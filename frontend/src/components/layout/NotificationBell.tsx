import { useState } from 'react'

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
 * NotificationBell — campana de notificaciones en el navbar.
 *
 * Consume `GET /api/notifications/unread-count` para el badge y
 * `GET /api/notifications` para el panel. Si el backend no está disponible,
 * degrada a 0 sin romper la UI.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const sessionValid = useIsSessionValid()

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

  // Escuchar evento SignalR NotificationReceived para actualizar en tiempo real.
  useRealtimeTicketHub({
    onNotificationReceived: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
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
    // If there's a ticketId, we could navigate to it
    // For now, just close the panel
    setOpen(false)
  }

  const getNotificationTypeClass = (type: string) => {
    switch (type) {
      case 'TicketAssigned':
      case 'TicketClaimed':
        return 'border-l-2 border-blue-500 bg-blue-50/50'
      case 'TicketPending':
        return 'border-l-2 border-amber-500 bg-amber-50/50'
      case 'TicketResolved':
      case 'TicketSolved':
        return 'border-l-2 border-emerald-500 bg-emerald-50/50'
      case 'TicketReopened':
        return 'border-l-2 border-indigo-500 bg-indigo-50/50'
      default:
        return 'border-l-2 border-slate-500 bg-slate-50/50'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TicketAssigned':
      case 'TicketClaimed':
        return '👤'
      case 'TicketPending':
        return '⏳'
      case 'TicketResolved':
      case 'TicketSolved':
        return '✅'
      case 'TicketReopened':
        return '🔄'
      default:
        return '🔔'
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
        className="relative h-8 w-8 p-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          data-testid="notification-panel"
          className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-xl z-50"
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={async () => {
                  // Mark all as read
                  try {
                    await apiClient.put('/notifications/read-all')
                    void queryClient.invalidateQueries({ queryKey: ['notifications'] })
                  } catch {
                    // ignore
                  }
                }}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    'p-3 text-sm transition-colors cursor-pointer hover:bg-muted/30',
                    (!n.read && !n.isRead) ? 'bg-primary/5 font-medium' : 'opacity-70',
                    getNotificationTypeClass(n.type)
                  )}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5 flex-shrink-0" aria-hidden="true">
                      {getNotificationIcon(n.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatRelative(n.createdAt)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body || n.message}</p>
                      {n.ticketId && (
                        <p className="text-[10px] text-primary mt-1 font-medium">Ticket #{n.ticketId}</p>
                      )}
                    </div>
                    {(!n.read && !n.isRead) && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1" aria-label="No leída" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
