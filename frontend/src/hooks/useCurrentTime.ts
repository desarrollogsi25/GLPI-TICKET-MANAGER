import { useEffect, useState } from 'react'

/**
 * Hook to provide reactive real-time ticks every intervalMs (defaults to 30s per H-61).
 * Forces relative date strings ("hace X minutos") to update automatically without reload.
 */
export function useCurrentTime(intervalMs = 30000): Date {
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
