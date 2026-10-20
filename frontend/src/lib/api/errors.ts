import axios from 'axios'

interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
}

/** Fallbacks for status codes whose ProblemDetails detail/title may be missing. */
const STATUS_FALLBACK: Record<number, string> = {
  403: 'No tienes permiso para realizar esta acción.',
  422: 'La solicitud no se pudo procesar. Revisá los datos e intentá de nuevo.',
}

/**
 * Turns an axios error into a message suitable for the UI.
 * The API answers failures with RFC 7807 ProblemDetails.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    const problem = error.response?.data
    const status = error.response?.status

    // Network / timeout failures have no ProblemDetails body; resolve them first.
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'No se pudo conectar al servidor. ¿Está el backend en marcha?'
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'El API tardó demasiado en responder.'
    }

    if (problem?.errors) {
      const firstError = Object.values(problem.errors).flat()[0]
      if (firstError) {
        return firstError
      }
    }

    if (problem?.detail) {
      return problem.detail
    }

    if (problem?.title) {
      return problem.title
    }

    // 403/422 get an explicit, user-facing message when the API sent no body
    // (or an empty one), so the toast is never a bare "HTTP 422".
    if (status != null && STATUS_FALLBACK[status]) {
      return STATUS_FALLBACK[status]
    }

    if (status) {
      return `El API respondió con un error (HTTP ${status}).`
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ha ocurrido un error inesperado.'
}

/** Field-level validation errors returned by the API (400 responses). */
export function getApiFieldErrors(error: unknown): Record<string, string[]> | null {
  if (axios.isAxiosError<ProblemDetails>(error) && error.response?.data?.errors) {
    return error.response.data.errors
  }

  return null
}

/** HTTP status of an axios error, or null when it never reached the server. */
export function getApiErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status != null) {
    return error.response.status
  }
  return null
}

/**
 * Short, human toast title for permission/validation failures.
 * Falls back to the caller-supplied title for any other status.
 */
export function getApiErrorTitle(error: unknown, fallback: string): string {
  const status = getApiErrorStatus(error)
  if (status === 403) {
    return 'No tienes permiso para realizar esta acción'
  }
  if (status === 422) {
    return fallback
  }
  return fallback
}
