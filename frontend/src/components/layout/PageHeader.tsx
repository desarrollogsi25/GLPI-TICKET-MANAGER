import { type ReactNode } from 'react'
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string | ReactNode
  description?: string | ReactNode
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 pb-4 border-b border-border/60', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          {typeof title === 'string' ? (
            <h1 className="text-[clamp(1.5rem,3.5vw,2rem)] font-bold font-serif tracking-tight text-foreground leading-tight">
              {title}
            </h1>
          ) : (
            title
          )}

          {description && (
            <p className="text-sm text-muted-foreground leading-normal max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
