import axios from 'axios'

/**
 * True only for connectivity failures. Cancellations reject without a response
 * too, but React Query aborts in-flight queries on unmount; that is not an
 * outage and must not surface a network-error toast.
 */
export function isNetworkFailure(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') return false
  return (
    !error.response ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT'
  )
}
