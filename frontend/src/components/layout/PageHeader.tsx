import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { type BreadcrumbItem } from './Breadcrumbs'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string | ReactNode
  description?: string | ReactNode
  breadcrumbs?: BreadcrumbItem[]
  backHref?: string
  backLabel?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = 'Volver',
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-5 pb-4 border-b border-border', className)}>
      {backHref && (
        <div className="mb-2">
          <Link
            to={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          {typeof title === 'string' ? (
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
          ) : (
            title
          )}

          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  )
}
