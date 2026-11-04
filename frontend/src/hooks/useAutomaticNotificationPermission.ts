/**
 * Notification helper hook.
 * Per UX/UI guidelines: Do NOT automatically request notification permissions upon login or first click.
 * Permissions are solely requested through explicit user action (e.g. "Activar notificaciones del dispositivo" in Preferences).
 */
export function useAutomaticNotificationPermission() {
  // Explicitly no-op: user must activate via explicit action button in Preferences.
}

/** Existing realtime events can display persistent notifications while the app is connected. */
export async function showNativeNotification(title: string, body: string, ticketId?: number | null) {
  if (!window.isSecureContext || !('Notification' in window) ||
      Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (!registration) return
    const activeRegistration = registration.active ? registration : await navigator.serviceWorker.ready
    await activeRegistration.showNotification(title, {
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: { url: ticketId ? `/tickets/${ticketId}` : '/kanban' },
    })
  } catch {
    // Permission revocation, an inactive worker or an OS failure must not disrupt the UI.
  }
}
