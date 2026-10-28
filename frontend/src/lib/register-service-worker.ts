import { registerSW } from 'virtual:pwa-register'

// Keep one generated worker; custom-sw.js is imported by its Workbox build.
// Importing the virtual client also enables the existing autoUpdate policy.
if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      const checkForUpdate = () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => undefined)
      }
      document.addEventListener('visibilitychange', checkForUpdate)
      checkForUpdate()
    },
    onRegisterError: () => {
      // In-page notifications remain available if OS notifications are blocked.
    },
  })
}
