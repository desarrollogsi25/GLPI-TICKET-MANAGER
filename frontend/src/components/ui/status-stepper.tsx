import { Check, PauseCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

interface TicketStatusStepperProps {
  status: number
  className?: string
}

const STEPS = [
  { code: 1, label: 'Nuevo' },
  { code: 2, label: 'Asignado' },
  { code: 3, label: 'En proceso' },
  { code: 5, label: 'Resuelto' },
  { code: 6, label: 'Cerrado' },
] as const

function stepRank(status: number): number {
  if (status === 4) return 2 // Pendiente branches off after Asignado/En proceso
  return status
}

/**
 * Enterprise ITIL lifecycle visual progress indicator (GLPI 1 -> 2 -> 3 -> 5 -> 6, with Pending branch).
 */
export function TicketStatusStepper({ status, className }: TicketStatusStepperProps) {
  const rank = stepRank(status)
  const isPending = status === 4

  return (
    <div
      aria-label="Progreso del ciclo de vida del ticket"
      data-testid="ticket-status-stepper"
      className={cn(
        'rounded-xl border border-border bg-card px-4 py-3 shadow-xs',
        className,
      )}
    >
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = rank > step.code
          const isCurrent = status === step.code
          const isPendingBranch = isPending && step.code === 3

          return (
            <li key={step.code} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'hidden sm:block absolute top-3 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 rounded-full',
                    rank > step.code ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}

              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'relative z-10 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCurrent
                      ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/25'
                      : isPendingBranch
                        ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                        : 'border-border bg-muted/50 text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />
                ) : isPendingBranch ? (
                  <PauseCircle className="size-3.5" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </span>

              <span
                className={cn(
                  'mt-1.5 text-[10px] sm:text-xs leading-tight truncate max-w-full',
                  isCurrent
                    ? 'font-semibold text-foreground'
                    : isPendingBranch
                      ? 'font-semibold text-amber-700 dark:text-amber-300'
                      : isCompleted
                        ? 'font-medium text-foreground/80'
                        : 'text-muted-foreground',
                )}
              >
                {isPendingBranch ? 'En espera' : step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
