import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import './index.css'

import { getApiErrorStatus } from '@/lib/api/errors'

/**
 * BUG-032 / H-32: a rate-limited request must NOT be retried.
 *
 * The default `retry: 1` fired an immediate second request one second after every
 * 429, which doubled the pressure on the very bucket that had just rejected us and
 * turned a rejection into a loop. Client errors (4xx) are deterministic too: the same
 * request would fail the same way, so only network errors and 5xx are worth one
 * more attempt.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = getApiErrorStatus(error)

  if (status === 429) return false
  if (status != null && status >= 400 && status < 500) return false

  return failureCount < 1
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
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
