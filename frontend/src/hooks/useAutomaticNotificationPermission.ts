import { useEffect } from 'react'

import { useIsSessionValid } from '@/hooks/useSessionValidity'

const PERMISSION_ATTEMPT_KEY = 'glpi.notification-permission-requested'
let attemptedInThisPage = false

function wasPermissionRequested(): boolean {
  if (attemptedInThisPage) return true
  try {
    return localStorage.getItem(PERMISSION_ATTEMPT_KEY) === 'true'
  } catch {
    return false
  }
}

function canRequestPermission(): boolean {
  if (!window.isSecureContext || window.top !== window || !('Notification' in window) ||
      !('serviceWorker' in navigator) || typeof Notification.requestPermission !== 'function') return false

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const installed = (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches

  return (!isIos || installed) && Notification.permission === 'default'
}

/** Request once, on the first trusted click after the authenticated layout mounts. */
export function useAutomaticNotificationPermission() {
  const sessionValid = useIsSessionValid()

  useEffect(() => {
    if (!sessionValid || wasPermissionRequested() || !canRequestPermission()) return

    const onFirstClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.button !== 0) return
      window.removeEventListener('click', onFirstClick, true)
      if (wasPermissionRequested() || !canRequestPermission()) return

      attemptedInThisPage = true
      try {
        localStorage.setItem(PERMISSION_ATTEMPT_KEY, 'true')
      } catch {
        // The in-memory guard still prevents repeated prompts when storage is unavailable.
      }
      try {
        // Call synchronously inside the click handler to preserve browser user activation.
        void Notification.requestPermission().catch(() => {})
      } catch {
        // Unsupported or browser-blocked requests remain silent and are not retried.
      }
    }

    // Capture runs before React handlers; the login click has already passed this phase.
    window.addEventListener('click', onFirstClick, true)
    return () => window.removeEventListener('click', onFirstClick, true)
  }, [sessionValid])
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
