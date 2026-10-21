import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { queryKeys } from '@/lib/api/queryKeys'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface TicketClaimedPayload {
  ticketId: number
  assignedUserId: number
  groupId: number
  timestamp: string
}

export interface TicketStatusChangedPayload {
  ticketId: number
  newStatus: number
  assigneeId?: number | null
  timestamp: string
}

export interface SolutionAddedPayload {
  ticketId: number
  authorUserId: number
  timestamp: string
}

export interface TicketCreatedPayload {
  ticketId: number
  groupId?: number
  timestamp?: string
}

export interface UseRealtimeTicketHubOptions {
  groupId?: number | null
  onTicketStatusChanged?: (ticketId: number, newStatus: number) => void
  onTicketClaimed?: (ticketId: number, groupId: number) => void
  onTicketCreated?: (ticketId: number, groupId?: number) => void
}

const signalRLogger = {
  log(logLevel: LogLevel, message: string) {
    if (
      message.includes('stopped during negotiation') ||
      message.includes('stopped by the user') ||
      message.includes('AbortError')
    ) {
      return
    }
    if (logLevel >= LogLevel.Warning) {
      console.warn(message)
    }
  },
}

type Listener = UseRealtimeTicketHubOptions
const activeListeners = new Set<Listener>()

let sharedConnection: HubConnection | null = null
let sharedToken: string | null = null
let connectionRefCount = 0
let currentConnectionState: ConnectionState = 'disconnected'
const stateListeners = new Set<(state: ConnectionState) => void>()

/** Delay before retrying a failed negotiation (the AbortError path). */
const NEGOTIATION_RETRY_MS = 5000
/** Timer handle for the pending negotiation retry, if any. */
let negotiationRetryTimer: ReturnType<typeof setTimeout> | null = null

function clearNegotiationRetry() {
  if (negotiationRetryTimer !== null) {
    clearTimeout(negotiationRetryTimer)
    negotiationRetryTimer = null
  }
}

/** True when an error is the expected "stopped during negotiation" AbortError. */
function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof Error) {
    return error.name === 'AbortError' || /stopped during negotiation|aborted/i.test(error.message)
  }
  return false
}

function updateConnectionState(newState: ConnectionState) {
  currentConnectionState = newState
  stateListeners.forEach((cb) => cb(newState))
}

export function useRealtimeTicketHub(options?: UseRealtimeTicketHubOptions) {
  const token = useAuthStore((s) => s.accessToken ?? s.token)
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] =
    useState<ConnectionState>(currentConnectionState)

  const optionsRef = useRef(options)
  useEffect(() => {
    optionsRef.current = options
  })

  // Registrar listeners de callbacks
  useEffect(() => {
    if (!options) return
    const listener: Listener = {
      onTicketStatusChanged: (ticketId, newStatus) =>
        optionsRef.current?.onTicketStatusChanged?.(ticketId, newStatus),
      onTicketClaimed: (ticketId, groupId) =>
        optionsRef.current?.onTicketClaimed?.(ticketId, groupId),
      onTicketCreated: (ticketId, groupId) =>
        optionsRef.current?.onTicketCreated?.(ticketId, groupId),
    }
    activeListeners.add(listener)
    return () => {
      activeListeners.delete(listener)
    }
  }, [options != null]) // eslint-disable-line react-hooks/exhaustive-deps

  // Suscripción dinámica al grupo cuando cambia el groupId en la UI
  useEffect(() => {
    const gid = options?.groupId
    if (gid && sharedConnection && currentConnectionState === 'connected') {
      sharedConnection.invoke('SubscribeToGroup', gid).catch(() => {})
    }
  }, [options?.groupId])

  // Registrar listener de estado de conexión
  useEffect(() => {
    stateListeners.add(setConnectionState)
    setConnectionState(currentConnectionState)
    return () => {
      stateListeners.delete(setConnectionState)
    }
  }, [])

  // Manejo de conexión compartida
  useEffect(() => {
    if (!token) {
      updateConnectionState('disconnected')
      return
    }

    connectionRefCount++

    // Generation guard: any async callback created by this effect (negotiation retry,
    // start().then/catch) becomes a no-op once the effect is torn down. This is what
    // prevents the "AbortError: The connection was stopped during negotiation" from
    // surfacing when a component mounts/unmounts quickly (React 19 StrictMode, route
    // transitions or a token refresh).
    let disposed = false

    const startConnection = (connection: HubConnection) => {
      if (disposed) return
      updateConnectionState('connecting')

      connection
        .start()
        .then(() => {
          if (disposed) return
          clearNegotiationRetry()
          updateConnectionState('connected')
          const initialGroup = optionsRef.current?.groupId ?? 1
          connection.invoke('SubscribeToGroup', initialGroup).catch(() => {})
        })
        .catch((err) => {
          if (disposed) return
          if (isAbortError(err)) {
            // Expected during fast mount/unmount or a token swap. Retry after 5s
            // instead of surfacing the error, and never block the UI on it.
            updateConnectionState('connecting')
            clearNegotiationRetry()
            negotiationRetryTimer = setTimeout(() => {
              negotiationRetryTimer = null
              startConnection(connection)
            }, NEGOTIATION_RETRY_MS)
            return
          }
          console.warn('SignalR connection failed:', err)
          updateConnectionState('disconnected')
          clearNegotiationRetry()
          negotiationRetryTimer = setTimeout(() => {
            negotiationRetryTimer = null
            startConnection(connection)
          }, NEGOTIATION_RETRY_MS)
        })
    }

    if (!sharedConnection || sharedToken !== token) {
      if (sharedConnection) {
        // stop() may reject with an AbortError mid-negotiation; swallow it.
        sharedConnection.stop().catch(() => {})
      }

      sharedToken = token

      const apiBase = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? ''
      const hubEndpoint = apiBase ? `${apiBase.replace(/\/api\/?$/, '')}/hubs/tickets` : '/hubs/tickets'

      const connection = new HubConnectionBuilder()
        .withUrl(hubEndpoint, {
          accessTokenFactory: () => token,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (ctx) => {
            const delays = [1000, 2000, 4000, 8000, 16000, 30000]
            return delays[Math.min(ctx.previousRetryCount, delays.length - 1)]
          },
        })
        .configureLogging(signalRLogger)
        .build()

      // Eventos
      connection.on('TicketClaimed', (payload: TicketClaimedPayload) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tickets.byGroupQueue(payload.groupId),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        activeListeners.forEach((l) =>
          l.onTicketClaimed?.(payload.ticketId, payload.groupId),
        )
      })

      connection.on('TicketStatusChanged', (payload: TicketStatusChangedPayload) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tickets.detail(payload.ticketId),
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        activeListeners.forEach((l) =>
          l.onTicketStatusChanged?.(payload.ticketId, payload.newStatus),
        )
      })

      connection.on('SolutionAdded', (payload: SolutionAddedPayload) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tickets.detail(payload.ticketId),
        })
      })

      connection.onreconnecting(() => {
        updateConnectionState('connecting')
      })
      connection.onreconnected(() => {
        updateConnectionState('connected')
      })
      connection.onclose(() => {
        updateConnectionState('disconnected')
      })

      startConnection(connection)

      sharedConnection = connection
    }

    return () => {
      disposed = true
      clearNegotiationRetry()
      connectionRefCount--
      if (connectionRefCount <= 0) {
        connectionRefCount = 0
        if (sharedConnection) {
          sharedConnection.stop().catch(() => {})
          sharedConnection = null
          sharedToken = null
          updateConnectionState('disconnected')
        }
      }
    }
  }, [token, queryClient])

  return { connectionState }
}
