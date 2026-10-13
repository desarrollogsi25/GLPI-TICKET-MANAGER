import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : null
}

export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? format(date, 'dd/MM/yyyy HH:mm', { locale: es }) : '—'
}

export function formatRelative(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? formatDistanceToNowStrict(date, { addSuffix: true, locale: es }) : '—'
}

export function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' ? new Intl.NumberFormat('es-ES').format(value) : '—'
}

export function truncate(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

/**
 * GLPI stores descriptions as rich HTML. We render them as plain text
 * (never through dangerouslySetInnerHTML) to avoid injecting markup.
 */
export function toPlainText(value: string | null | undefined): string {
  if (!value) {
    return ''
  }

  const parsed = new DOMParser().parseFromString(value, 'text/html')
  return parsed.body.textContent?.trim() ?? ''
}
