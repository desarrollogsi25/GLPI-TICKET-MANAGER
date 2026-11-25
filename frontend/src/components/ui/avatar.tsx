import { User } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string | null
  initials?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  tone?: 'primary' | 'muted' | 'success'
  className?: string
  title?: string
  'data-testid'?: string
}

function deriveInitials(name?: string | null): string {
  const cleaned = (name ?? '').trim()
  if (!cleaned) return ''
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return cleaned.slice(0, 2).toUpperCase()
}

const SIZE_MAP = {
  xs: 'size-6 text-[10px]',
  sm: 'size-7 text-[11px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
} as const

const TONE_MAP = {
  primary: 'bg-primary/12 text-primary border-primary/20',
  muted: 'bg-muted text-muted-foreground border-border',
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
} as const

export function Avatar({
  name,
  initials,
  size = 'md',
  tone = 'primary',
  className,
  title,
  'data-testid': testId,
}: AvatarProps) {
  const display = initials ?? deriveInitials(name)
  return (
    <span
      role="img"
      aria-label={title || name || 'Usuario'}
      title={title || name || undefined}
      data-testid={testId}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border font-semibold select-none',
        SIZE_MAP[size],
        TONE_MAP[tone],
        className,
      )}
    >
      {display || <User className="size-3.5" aria-hidden="true" />}
    </span>
  )
}
