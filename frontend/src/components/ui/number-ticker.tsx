import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

interface NumberTickerProps {
  value: number
  className?: string
  durationMs?: number
  'data-testid'?: string
}

/**
 * NumberTicker (21st.dev / Magic UI style, respecting Emil Kowalski's rules):
 * - Smoothly counts up or down to `value` over `durationMs` (default 260ms, < 300ms)
 *   using a strong ease-out curve `1 - (1 - t)^3`.
 * - Respects `prefers-reduced-motion` by displaying the final value immediately.
 * - Uses `tabular-nums` so digits never shift layout horizontally while counting.
 */
export function NumberTicker({
  value,
  className,
  durationMs = 260,
  'data-testid': dataTestId,
}: NumberTickerProps) {
  const prefersReduced = useReducedMotion()
  const [displayValue, setDisplayValue] = useState<number>(value)
  const previousValueRef = useRef<number>(0)

  useEffect(() => {
    if (prefersReduced) {
      setDisplayValue(value)
      previousValueRef.current = value
      return
    }

    const startValue = previousValueRef.current
    const endValue = value

    if (startValue === endValue) {
      setDisplayValue(endValue)
      return
    }

    let animationFrameId = 0
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endValue)
        previousValueRef.current = endValue
      }
    }

    animationFrameId = window.requestAnimationFrame(step)
    return () => {
      window.cancelAnimationFrame(animationFrameId)
      previousValueRef.current = endValue
    }
  }, [value, durationMs, prefersReduced])

  return (
    <span data-testid={dataTestId} className={cn('tabular-nums', className)}>
      {displayValue}
    </span>
  )
}
