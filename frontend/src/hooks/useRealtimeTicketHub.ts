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

export function useRealtimeTicketHub() {
  const token = useAuthStore((s) => s.accessToken ?? s.token)
  const queryClient = useQueryClient()
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  const connectionRef = useRef<HubConnection | null>(null)

  useEffect(() => {
    if (!token) {
      setConnectionState('disconnected')
      return
    }

    setConnectionState('connecting')
    let isCancelled = false

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/tickets', {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          // backoff exponencial: 1s, 2s, 4s, 8s, 16s, 30s max
          const delays = [1000, 2000, 4000, 8000, 16000, 30000]
          return delays[Math.min(ctx.previousRetryCount, delays.length - 1)]
        },
      })
      .configureLogging(signalRLogger)
      .build()

    // Eventos
    connection.on('TicketClaimed', (payload: TicketClaimedPayload) => {
      // Alguien reclamó un ticket → refrescar cola del grupo
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.byGroupQueue(payload.groupId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    connection.on('TicketStatusChanged', (payload: TicketStatusChangedPayload) => {
      // Cambio de estado → refrescar ticket detalle + listas
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(payload.ticketId),
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.tickets.all })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    connection.on('SolutionAdded', (payload: SolutionAddedPayload) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tickets.detail(payload.ticketId),
      })
    })

    connection.onreconnecting(() => {
      if (!isCancelled) setConnectionState('connecting')
    })
    connection.onreconnected(() => {
      if (!isCancelled) setConnectionState('connected')
    })
    connection.onclose(() => {
      if (!isCancelled) setConnectionState('disconnected')
    })

    connection
      .start()
      .then(() => {
        if (isCancelled) {
          connection.stop().catch(() => {})
          return
        }
        setConnectionState('connected')
        // Suscribirse a la cola del grupo 1 por defecto (grupo del técnico)
        connection.invoke('SubscribeToGroup', 1).catch(() => {})
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn('SignalR connection failed:', err)
        setConnectionState('disconnected')
      })

    connectionRef.current = connection

    return () => {
      isCancelled = true
      connection.stop().catch(() => {})
      connectionRef.current = null
      setConnectionState('disconnected')
    }
  }, [token, queryClient])

  return { connectionState }
}
