import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { useRealtimeTicketHub } from '@/hooks/useRealtimeTicketHub'

interface Notification {
  id: number
  title: string
  body: string
  read: boolean
  createdAt: string
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const queryClient = useQueryClient()

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
    refetchInterval: 60_000,
  })

  // Escuchar evento SignalR NotificationReceived para actualizar en tiempo real.
  useRealtimeTicketHub({
    onNotificationReceived: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })

  const loadNotifications = async () => {
    try {
      const { data } = await apiClient.get<Notification[]>('/notifications')
      setNotifications(Array.isArray(data) ? data : [])
    } catch {
      setNotifications([])
    }
  }

  const handleToggle = () => {
    if (!open) void loadNotifications()
    setOpen((v) => !v)
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
          <div className="p-3 border-b border-border">
            <h3 className="text-sm font-semibold">Notificaciones</h3>
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn('p-3 text-sm', !n.read && 'bg-primary/5')}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.createdAt}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
