self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : 'Nueva notificación recibida' }
  }

  const title = data.title || 'GLPI Ticket Manager'
  const tag = data.tag || (data.ticketId ? `ticket-${data.ticketId}` : title)
  const options = {
    body: data.body || 'Tienes una actualización en tus tickets',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag,
    renotify: false,
    data: {
      url: data.url || '/kanban',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/kanban'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})
