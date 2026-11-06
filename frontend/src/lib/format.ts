import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function toDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  // Si no contiene indicador de zona horaria (Z o +/-), añadir 'Z' para parsear como UTC
  const normalized = trimmed.replace(' ', 'T')
  const hasTimezone = normalized.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(normalized)
  const utcString = hasTimezone ? normalized : `${normalized}Z`

  // GLPI stores "no date" as 0000-00-00, which some drivers surface as year 1.
  // Rendering that as "hace 2027 años" is worse than showing the em dash.
  const isUsable = (date: Date) => isValid(date) && date.getUTCFullYear() >= 1970

  const parsed = parseISO(utcString)
  if (isUsable(parsed)) {
    return parsed
  }

  // Fallback directo a parseISO original
  const direct = parseISO(trimmed)
  return isUsable(direct) ? direct : null
}

export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  return date ? format(date, 'dd/MM/yyyy HH:mm', { locale: es }) : '—'
}

export function formatRelative(
  value: string | null | undefined,
  _baseDate?: Date,
): string {
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

  if (typeof DOMParser === 'undefined') {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  try {
    const parsed = new DOMParser().parseFromString(value, 'text/html')
    const blockTags = parsed.querySelectorAll('p, div, br, hr, li, h1, h2, h3, h4, h5, h6, tr')
    blockTags.forEach((el) => {
      if (el.tagName.toLowerCase() === 'br') {
        el.replaceWith('\n')
      } else {
        el.after('\n')
      }
    })

    return (parsed.body.textContent ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
      .join('\n')
      .trim()
  } catch {
    return value.replace(/<[^>]+>/g, ' ').trim()
  }
}
