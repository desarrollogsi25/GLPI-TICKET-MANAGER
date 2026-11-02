export function localDateTime(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`
}

/** Reject DST gaps/overlaps instead of scheduling at an unintended local time. */
export function parseUnambiguousLocal(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime()) || localDateTime(date) !== value) return null
  const oneHourLater = new Date(date.getTime() + 60 * 60_000)
  if (localDateTime(oneHourLater) === value) return null
  return date
}
