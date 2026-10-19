import axios from 'axios'

import { useAuthStore } from '@/store/authStore'

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
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A rejected token means the session is no longer usable.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clear()
    }

    return Promise.reject(error)
  },
)
