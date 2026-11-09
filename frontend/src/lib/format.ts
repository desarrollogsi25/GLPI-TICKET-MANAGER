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

  // MariaDB y GLPI persisten los timestamps en UTC (NOW() == UTC_TIMESTAMP()).
  // Si la cadena incluye hora pero carece de indicador de zona (Z o +/-), añadir 'Z'
  // para que date-fns/browser la interprete como instante UTC y la convierta a la hora local
  // del usuario (Europe/Madrid, Europe/Paris, America/Lima), evitando el desfase de "hace 1 hora".
  let normalized = trimmed.replace(' ', 'T')
  const hasTime = normalized.includes(':')
  const hasZone = normalized.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(normalized)
  if (hasTime && !hasZone) {
    normalized = `${normalized}Z`
  }

  // GLPI stores "no date" as 0000-00-00, which some drivers surface as year 1.
  // Rendering that as "hace 2027 años" is worse than showing the em dash.
  const isUsable = (date: Date) => isValid(date) && date.getFullYear() >= 1970

  const parsed = parseISO(normalized)
  if (isUsable(parsed)) {
    return parsed
  }

  // Fallback directo a new Date
  const direct = new Date(trimmed)
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
