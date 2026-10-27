/**
 * GLPI numeric codes and their presentation metadata.
 *
 * Note: GLPI calls status 4 "Waiting"; the kanban/prototype spec names the column
 * "Pending". The numeric value (4) is what matters on the wire.
 */

export interface TicketStatusMeta {
  value: number
  label: string
  badgeClass: string
}

export const TICKET_STATUSES: TicketStatusMeta[] = [
  { value: 1, label: 'Nuevo', badgeClass: 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
  { value: 2, label: 'Asignado', badgeClass: 'border-transparent bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' },
  { value: 3, label: 'Planificado', badgeClass: 'border-transparent bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300' },
  { value: 4, label: 'Pendiente', badgeClass: 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' },
  { value: 5, label: 'Resuelto', badgeClass: 'border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { value: 6, label: 'Cerrado', badgeClass: 'border-transparent bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
]

const STATUS_BY_VALUE = new Map(TICKET_STATUSES.map((status) => [status.value, status]))

export function statusMeta(status: number): TicketStatusMeta {
  return (
    STATUS_BY_VALUE.get(status) ?? {
      value: status,
      label: `Estado ${status}`,
      badgeClass: 'border-transparent bg-muted text-muted-foreground',
    }
  )
}

export interface TicketPriorityMeta {
  value: number
  label: string
  badgeClass: string
}

export const TICKET_PRIORITIES: TicketPriorityMeta[] = [
  { value: 1, label: 'Muy baja', badgeClass: 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 2, label: 'Baja', badgeClass: 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300' },
  { value: 3, label: 'Media', badgeClass: 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { value: 4, label: 'Alta', badgeClass: 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 badge-pulse-subtle' },
  { value: 5, label: 'Muy alta', badgeClass: 'border-transparent bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 badge-pulse-subtle' },
  { value: 6, label: 'Crítica', badgeClass: 'border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white badge-pulse-subtle' },
]

const PRIORITY_BY_VALUE = new Map(TICKET_PRIORITIES.map((priority) => [priority.value, priority]))

export function priorityMeta(priority: number): TicketPriorityMeta {
  return (
    PRIORITY_BY_VALUE.get(priority) ?? {
      value: priority,
      label: `Prioridad ${priority}`,
      badgeClass: 'border-transparent bg-muted text-muted-foreground',
    }
  )
}

export const TICKET_TYPES = [
  { value: 1, label: 'Incidente' },
  { value: 2, label: 'Solicitud' },
] as const

export function typeLabel(type: number): string {
  return TICKET_TYPES.find((item) => item.value === type)?.label ?? `Tipo ${type}`
}
