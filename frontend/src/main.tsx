import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'

import { getApiErrorStatus } from '@/lib/api/errors'

/**
 * BUG-032 / H-32 / H-59: a rate-limited request must NOT be retried.
 *
 * Zero retries on 429 or client 4xx errors to eliminate retry storms.
 * For transient network/5xx errors, allow exponential backoff retries up to 2 attempts.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status =
    (error as { response?: { status?: number }; status?: number })?.response?.status ??
    (error as { response?: { status?: number }; status?: number })?.status ??
    getApiErrorStatus(error)

  if (status === 429) return false
  if (status != null && status >= 400 && status < 500) return false

  return failureCount < 2
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // H-62: Optimización de rendimiento evitando refetches excesivos
      staleTime: 5 * 60 * 1000,
      retry: shouldRetry,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (_failureCount, error) => {
        const status =
          (error as { response?: { status?: number }; status?: number })?.response?.status ??
          (error as { response?: { status?: number }; status?: number })?.status ??
          getApiErrorStatus(error)
        if (status === 429) return false
        return false
      },
    },
  },
})

const container = document.getElementById('root')

if (!container) {
  throw new Error('Elemento #root no encontrado en index.html')
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
