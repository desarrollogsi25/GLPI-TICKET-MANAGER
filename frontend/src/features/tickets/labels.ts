import type { AppRole } from '@/lib/api/types'

/**
 * GLPI numeric codes and their presentation metadata.
 * Follows IBM Carbon / Atlassian Design System semantic hierarchy:
 * - Active/urgent states use clear high-contrast semantic lozenges.
 * - Terminal Closed state is intentionally muted to keep active work scannable.
 */

export interface TicketStatusMeta {
  value: number
  label: string
  badgeClass: string
  dotClass: string
}

export const TICKET_STATUSES: TicketStatusMeta[] = [
  {
    value: 1,
    label: 'Nuevo',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200',
    dotClass: 'bg-sky-500',
  },
  {
    value: 2,
    label: 'Asignado',
    badgeClass: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800/70 dark:bg-indigo-950/60 dark:text-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  {
    value: 3,
    label: 'En proceso (planificado)',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-200',
    dotClass: 'bg-blue-600',
  },
  {
    value: 4,
    label: 'Pendiente',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/60 dark:text-amber-200',
    dotClass: 'bg-amber-500',
  },
  {
    value: 5,
    label: 'Resuelto',
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/70 dark:bg-emerald-950/60 dark:text-emerald-200',
    dotClass: 'bg-emerald-600',
  },
  {
    value: 6,
    label: 'Cerrado',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300',
    dotClass: 'bg-slate-500',
  },
]

const STATUS_BY_VALUE = new Map(TICKET_STATUSES.map((status) => [status.value, status]))

export function statusMeta(status: number): TicketStatusMeta {
  return (
    STATUS_BY_VALUE.get(status) ?? {
      value: status,
      label: `Estado ${status}`,
      badgeClass: 'border-border bg-muted text-muted-foreground',
      dotClass: 'bg-muted-foreground',
    }
  )
}

export interface TicketPriorityMeta {
  value: number
  label: string
  badgeClass: string
  stripeClass: string
}

export const TICKET_PRIORITIES: TicketPriorityMeta[] = [
  {
    value: 1,
    label: 'Muy baja',
    badgeClass: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    stripeClass: 'border-l-slate-300 dark:border-l-slate-600',
  },
  {
    value: 2,
    label: 'Baja',
    badgeClass: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/60 dark:text-sky-200',
    stripeClass: 'border-l-sky-400',
  },
  {
    value: 3,
    label: 'Media',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/70 dark:bg-blue-950/60 dark:text-blue-200',
    stripeClass: 'border-l-blue-500',
  },
  {
    value: 4,
    label: 'Alta',
    badgeClass: 'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-700/80 dark:bg-orange-950/70 dark:text-orange-200',
    stripeClass: 'border-l-orange-500',
  },
  {
    value: 5,
    label: 'Muy alta',
    badgeClass: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800/80 dark:bg-red-950/70 dark:text-red-200',
    stripeClass: 'border-l-red-500',
  },
  {
    value: 6,
    label: 'Crítica',
    badgeClass: 'border-red-700 bg-red-700 text-white dark:border-red-600 dark:bg-red-600 dark:text-white',
    stripeClass: 'border-l-red-700',
  },
]

const PRIORITY_BY_VALUE = new Map(TICKET_PRIORITIES.map((priority) => [priority.value, priority]))

export function priorityMeta(priority: number): TicketPriorityMeta {
  return (
    PRIORITY_BY_VALUE.get(priority) ?? {
      value: priority,
      label: `Prioridad ${priority}`,
      badgeClass: 'border-border bg-muted text-muted-foreground',
      stripeClass: 'border-l-border',
    }
  )
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Muy baja',
  2: 'Baja',
  3: 'Media',
  4: 'Alta',
  5: 'Muy alta',
}

export function urgencyLabel(urgency: number): string {
  return SCALE_LABELS[urgency] ?? `Nivel ${urgency}`
}

export function impactLabel(impact: number): string {
  return SCALE_LABELS[impact] ?? `Nivel ${impact}`
}

export const TICKET_TYPES = [
  { value: 1, label: 'Incidente' },
  { value: 2, label: 'Solicitud' },
] as const

export function typeLabel(type: number): string {
  return TICKET_TYPES.find((item) => item.value === type)?.label ?? `Tipo ${type}`
}

export function roleLabel(role?: AppRole | string | null): string {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'supervisor':
      return 'Supervisor'
    case 'technician':
      return 'Técnico'
    case 'solicitante':
      return 'Solicitante'
    default:
      return 'Usuario'
  }
}
