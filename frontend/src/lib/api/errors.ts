import axios from 'axios'

interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
  errors?: Record<string, string[]>
}

/**
 * Turns an axios error into a message suitable for the UI.
 * The API answers failures with RFC 7807 ProblemDetails.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ProblemDetails>(error)) {
    const problem = error.response?.data

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

    if (error.code === 'ERR_NETWORK') {
      return 'No se pudo contactar con el API. ¿Está el backend en marcha?'
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'El API tardó demasiado en responder.'
    }

    if (error.response?.status) {
      return `El API respondió con un error (HTTP ${error.response.status}).`
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
