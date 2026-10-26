import axios from 'axios'

import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'

let lastNetworkToastTime = 0
let lastRateLimitToastTime = 0
let isRedirecting401 = false

/**
 * Single axios instance for the whole app.
 *
 * `VITE_API_URL` defaults to `/api`. In development the Vite proxy forwards `/api`
 * to the API (VITE_PROXY_TARGET) and in production Nginx does the same, so the
 * browser always talks to its own origin and no CORS configuration is needed.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Fail fast instead of hanging forever when the API is unreachable.
  timeout: 15_000,
})

apiClient.interceptors.request.use((config) => {
  const state = useAuthStore.getState()
  const token = state.accessToken ?? state.token

  if (token) {
    isRedirecting401 = false
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A rejected token means the session is no longer usable.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/logout')

      if (!isAuthEndpoint && !isRedirecting401) {
        isRedirecting401 = true
        useAuthStore.getState().clear()
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.history.replaceState(null, '', '/login')
        }
      }
    }

    // BUG-032 / H-32: a 429 is a rate-limit rejection, NOT an authentication
    // problem. The session stays alive and the user is told to slow down. The
    // server sends `Retry-After` with the number of seconds to wait.
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      const now = Date.now()
      if (now - lastRateLimitToastTime > 10_000) {
        lastRateLimitToastTime = now
        const retryAfter = error.response.headers['retry-after']
        useToastStore.getState().push({
          title: 'Demasiadas solicitudes',
          description:
            retryAfter != null
              ? `El servidor pidió esperar ${retryAfter} s antes de reintentar.`
              : 'El servidor está limitando las solicitudes. Intentá de nuevo en unos segundos.',
          variant: 'destructive',
        })
      }
    }

    // Network errors (no response, timeout, server down)
    if (
      axios.isAxiosError(error) &&
      (!error.response ||
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ETIMEDOUT')
    ) {
      const now = Date.now()
      if (now - lastNetworkToastTime > 5000) {
        lastNetworkToastTime = now
        useToastStore.getState().push({
          title: 'Error de red',
          description: 'No se pudo conectar al servidor.',
          variant: 'destructive',
        })
      }
    }

    return Promise.reject(error)
  },
)
