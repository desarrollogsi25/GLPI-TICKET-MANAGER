import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  id?: string
  title: string
  description?: string
  count?: number | string
  icon?: React.ComponentType<{ className?: string }>
  actions?: ReactNode
  className?: string
}

export function SectionHeader({
  id,
  title,
  description,
  count,
  icon: Icon,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="min-w-0 space-y-0.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />}
          <h2 id={id} className="text-sm sm:text-base font-semibold tracking-tight text-foreground truncate">
            {title}
          </h2>
          {count !== undefined && (
            <Badge variant="secondary" className="text-[11px] font-semibold tabular-nums">
              {count}
            </Badge>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
