import { useEffect, useState } from 'react'
import type { ConnectionState } from '@/hooks/useRealtimeTicketHub'

interface ConnectionIndicatorProps {
  state: ConnectionState
  className?: string
  showLabel?: boolean
}

const stateConfig = {
  connected: {
    color: 'bg-emerald-500',
    ping: 'bg-emerald-400',
    label: 'Conectado en tiempo real',
    badgeText: 'En línea',
  },
  connecting: {
    color: 'bg-amber-500',
    ping: 'bg-amber-400',
    label: 'Conectando al servidor...',
    badgeText: 'Conectando',
  },
  disconnected: {
    color: 'bg-rose-500',
    ping: '',
    label: 'Desconectado de tiempo real',
    badgeText: 'Desconectado',
  },
}

export function ConnectionIndicator({
  state,
  className = '',
  showLabel = false,
}: ConnectionIndicatorProps) {
  const [effectiveState, setEffectiveState] = useState<ConnectionState>(state)

  useEffect(() => {
    if (state === 'connected' || state === 'connecting') {
      setEffectiveState(state)
      return
    }

    // Only switch to 'disconnected' if disconnected remains for > 3 seconds
    const timer = setTimeout(() => {
      setEffectiveState('disconnected')
    }, 3000)

    return () => clearTimeout(timer)
  }, [state])

  const config = stateConfig[effectiveState]

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${className}`}
      data-testid="connection-indicator"
      data-state={effectiveState}
      title={config.label}
    >
      <span className="relative flex h-2 w-2">
        {state === 'connected' && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`}
        />
      </span>
      <span className="sr-only">{config.label}</span>
      {showLabel && (
        <span className="text-[11px] text-muted-foreground select-none font-medium">
          {config.badgeText}
        </span>
      )}
    </div>
  )
}
