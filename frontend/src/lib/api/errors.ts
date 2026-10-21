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
  409: 'El ticket ya no está en un estado que permita esta operación.',
  422: 'La solicitud no se pudo procesar. Revisá los datos e intentá de nuevo.',
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  'Solution content exceeds maximum length': 'La solución excede la longitud máxima permitida.',
  'Solution is required': 'La solución es requerida.',
  'Solution content cannot be empty': 'El contenido de la solución no puede estar vacío.',
  'Ticket not found': 'Ticket no encontrado.',
  'Invalid status transition': 'Transición de estado no válida.',
  'Only administrators can reopen closed tickets': 'Solo los administradores pueden reabrir tickets cerrados.',
  'Only technicians or administrators can resolve tickets': 'Solo técnicos o administradores pueden resolver tickets.',
  'Unauthorized': 'No tienes autorización para realizar esta acción.',
  'Forbidden': 'Acceso denegado.',
  'Internal Server Error': 'Error interno del servidor.',
  'Network Error': 'Error de conexión de red.',
  // BUG-031 / H-31: GLPI answers a second solution write on an already solved
  // ticket with this message. It must never reach the technician verbatim.
  'El elemento ya está resuelto': 'Este ticket ya fue resuelto por otra operación.',
  'ya está resuelto': 'Este ticket ya fue resuelto por otra operación.',
  'ya fue resuelto': 'Este ticket ya fue resuelto por otra operación.',
  'ya está cerrado': 'Este ticket ya está cerrado.',
  'Ticket no puede marcarse como resuelto sin solución escrita.':
    'No se puede resolver el ticket sin escribir una solución.',
  'Solo el técnico asignado puede cambiar el estado de este ticket.':
    'Solo el técnico asignado al ticket puede resolverlo.',
}

function translateErrorMessage(msg: string): string {
  if (!msg) return msg
  const trimmed = msg.trim()
  for (const [en, es] of Object.entries(ERROR_TRANSLATIONS)) {
    if (trimmed.toLowerCase().includes(en.toLowerCase())) {
      return es
    }
  }
  return msg
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
        return translateErrorMessage(firstError)
      }
    }

    if (problem?.detail) {
      return translateErrorMessage(problem.detail)
    }

    if (problem?.title) {
      return translateErrorMessage(problem.title)
    }

    // 403/422 get an explicit, user-facing message when the API sent no body
    // (or an empty one), so the toast is never a bare "HTTP 422".
    if (status != null && STATUS_FALLBACK[status]) {
      return STATUS_FALLBACK[status]
    }

    if (status) {
      return `El API respondió con un error (HTTP ${status}).`
    }

    return translateErrorMessage(error.message)
  }

  if (error instanceof Error) {
    return translateErrorMessage(error.message)
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
  if (status === 409) {
    return 'El ticket ya no está en un estado que permita esta operación'
  }
  if (status === 422) {
    return fallback
  }
  return fallback
}
