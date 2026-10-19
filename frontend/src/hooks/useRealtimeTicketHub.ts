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

export interface UseRealtimeTicketHubOptions {
  onTicketStatusChanged?: (ticketId: number, newStatus: number) => void
  onTicketClaimed?: (ticketId: number, groupId: number) => void
}

const signalRLogger = {
  log(logLevel: LogLevel, message: string) {
    if (
      message.includes('stopped during negotiation') ||
      message.includes('stopped by the user')
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
    }
    activeListeners.add(listener)
    return () => {
      activeListeners.delete(listener)
    }
  }, [options != null]) // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!sharedConnection || sharedToken !== token) {
      if (sharedConnection) {
        sharedConnection.stop().catch(() => {})
      }

      sharedToken = token
      updateConnectionState('connecting')

      const connection = new HubConnectionBuilder()
        .withUrl('/hubs/tickets', {
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

      connection
        .start()
        .then(() => {
          updateConnectionState('connected')
          connection.invoke('SubscribeToGroup', 1).catch(() => {})
        })
        .catch((err) => {
          console.warn('SignalR connection failed:', err)
          updateConnectionState('disconnected')
        })

      sharedConnection = connection
    }

    return () => {
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
