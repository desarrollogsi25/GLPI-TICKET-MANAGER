import type { ReactNode } from 'react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
  className?: string
  'data-testid'?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
  'data-testid': testId,
}: EmptyStateProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 text-center',
        compact ? 'px-4 py-7' : 'px-6 py-12',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3',
          compact ? 'size-9' : 'size-11',
        )}
        aria-hidden="true"
      >
        <Icon className={compact ? 'size-4' : 'size-5'} />
      </div>
      <p className={cn('font-semibold text-foreground', compact ? 'text-xs' : 'text-sm')}>{title}</p>
      {description && (
        <p className={cn('text-muted-foreground mt-1 max-w-sm leading-relaxed', compact ? 'text-[11px]' : 'text-xs')}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  compact?: boolean
  className?: string
}

export function ErrorState({
  title = 'No se pudo cargar la información',
  message,
  onRetry,
  retryLabel = 'Reintentar',
  compact = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-destructive/35 bg-destructive/8 text-sm',
        compact ? 'p-3' : 'p-4',
        className,
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold text-foreground text-xs sm:text-sm">{title}</p>
          <p className="text-xs text-muted-foreground break-words">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 gap-1.5 self-start sm:self-center">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
