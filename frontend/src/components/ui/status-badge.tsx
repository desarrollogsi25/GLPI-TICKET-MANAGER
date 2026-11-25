import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  Lock,
  Minus,
  PauseCircle,
  UserCheck,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { priorityMeta, statusMeta } from '@/features/tickets/labels'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: number
  prefix?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function StatusIcon({ status, className }: { status: number; className?: string }) {
  switch (status) {
    case 1:
      return <CircleDot className={className} aria-hidden="true" />
    case 2:
      return <UserCheck className={className} aria-hidden="true" />
    case 3:
      return <CalendarClock className={className} aria-hidden="true" />
    case 4:
      return <PauseCircle className={className} aria-hidden="true" />
    case 5:
      return <CheckCircle2 className={className} aria-hidden="true" />
    case 6:
      return <Lock className={className} aria-hidden="true" />
    default:
      return <CircleDot className={className} aria-hidden="true" />
  }
}

/**
 * Semantic ITIL status lozenge following Atlassian & IBM Carbon guidance:
 * pairs explicit iconography with high-contrast text so status never relies on color alone.
 */
export function StatusBadge({
  status,
  prefix,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const meta = statusMeta(status)
  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-medium max-w-full',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs',
        meta.badgeClass,
        className,
      )}
    >
      {showIcon && <StatusIcon status={status} className={size === 'sm' ? 'size-3 shrink-0' : 'size-3.5 shrink-0'} />}
      <span className="truncate">{prefix ? `${prefix}${meta.label}` : meta.label}</span>
    </Badge>
  )
}

interface PriorityBadgeProps {
  priority: number
  showIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

function PriorityIcon({ priority, className }: { priority: number; className?: string }) {
  if (priority >= 6) return <AlertOctagon className={className} aria-hidden="true" />
  if (priority === 5) return <AlertTriangle className={className} aria-hidden="true" />
  if (priority === 4) return <ArrowUp className={className} aria-hidden="true" />
  if (priority === 3) return <Minus className={className} aria-hidden="true" />
  return <ArrowDown className={className} aria-hidden="true" />
}

/**
 * Semantic priority indicator with directional/severity icon + label (WCAG 1.4.1 compliant).
 */
export function PriorityBadge({
  priority,
  showIcon = true,
  size = 'md',
  className,
}: PriorityBadgeProps) {
  const meta = priorityMeta(priority)
  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        meta.badgeClass,
        className,
      )}
    >
      {showIcon && <PriorityIcon priority={priority} className={size === 'sm' ? 'size-3 shrink-0' : 'size-3.5 shrink-0'} />}
      <span>{meta.label}</span>
    </Badge>
  )
}
