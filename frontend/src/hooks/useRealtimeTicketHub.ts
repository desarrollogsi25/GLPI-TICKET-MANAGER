import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { queryKeys } from '@/lib/api/queryKeys'
import type { PagedResult, TicketDetail, TicketSummary } from '@/lib/api/types'

/**
 * Lifecycle of the realtime connection.
 *
 * `reconnecting` is distinct from `connecting`: the first one means "the hub was
 * working and we are recovering it" (the group membership is lost and has to be
 * restored), the second one means "we are establishing the connection for the first
 * time". BUG-032 / H-32 uses the distinction to decide when the Kanban is allowed to
 * fall back to polling.
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'reconnecting' | 'connected'

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
  onNotificationReceived?: () => void
}

const STATUS_LABELS: Record<number, string> = {
  1: 'Nuevo',
  2: 'Asignado',
  3: 'En Progreso',
  4: 'Pendiente',
  5: 'Resuelto',
  6: 'Cerrado',
}

function getStatusLabel(status: number): string {
  return STATUS_LABELS[status] ?? `Estado ${status}`
}

/**
 * H-41 Golden Rule 1: Optimistically updates cached ticket lists and detail queries
 * using `queryClient.setQueryData` so Kanban cards move between columns immediately
 * without triggering a full `invalidateQueries` on every status change.
 */
export function applyOptimisticTicketStatusUpdate(
  client: QueryClient,
  payload: TicketStatusChangedPayload,
) {
  const statusLabel = getStatusLabel(payload.newStatus)
  const updatedAt = payload.timestamp || new Date().toISOString()

  // 1. Update any paged TicketSummary cache (byAssignee, list, byGroupQueue)
  client.setQueriesData<PagedResult<TicketSummary>>(
    { queryKey: queryKeys.tickets.all },
    (old) => {
      if (!old || !Array.isArray(old.items)) return old
      const hasTicket = old.items.some((item) => item.id === payload.ticketId)
      if (!hasTicket) return old

      const nextItems = old.items.map((item) =>
        item.id === payload.ticketId
          ? {
              ...item,
              status: payload.newStatus,
              statusLabel,
              updatedAt,
            }
          : item,
      )
      return {
        ...old,
        items: nextItems,
      }
    },
  )

  // 2. If the ticket moved out of New/Assigned (status > 2), remove it from group queues
  if (payload.newStatus > 2) {
    client.setQueriesData<PagedResult<TicketSummary>>(
      { queryKey: ['tickets', 'group-queue'] },
      (old) => {
        if (!old || !Array.isArray(old.items)) return old
        if (!old.items.some((item) => item.id === payload.ticketId)) return old
        const filtered = old.items.filter((item) => item.id !== payload.ticketId)
        return {
          ...old,
          items: filtered,
          total: Math.max(0, (old.total ?? filtered.length + 1) - 1),
        }
      },
    )
  }

  // 3. Update ticket detail cache if loaded
  client.setQueryData<TicketDetail>(
    queryKeys.tickets.detail(payload.ticketId),
    (old) => {
      if (!old) return old
      return {
        ...old,
        status: payload.newStatus,
        statusLabel,
        updatedAt,
      }
    },
  )
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
/** Upper bound for waiting on a pending WebSocket handshake while stopping. */
const REALTIME_STOP_TIMEOUT_MS = 5000
/**
 * The in-flight `connection.start()` handshake, if any.
 */
let pendingStart: Promise<void> | null = null

function clearNegotiationRetry() {
  if (negotiationRetryTimer !== null) {
    clearTimeout(negotiationRetryTimer)
    negotiationRetryTimer = null
  }
}

export const REALTIME_INVALIDATION_DEBOUNCE_MS = 800
export const REALTIME_INVALIDATION_MAX_WAIT_MS = 3000
const REALTIME_INVALIDATION_MIN_INTERVAL_MS = 1000

let invalidationTimer: ReturnType<typeof setTimeout> | null = null
let invalidationQueryClient: QueryClient | null = null
const subscribedGroupIds = new Set<number>()
let pendingNotificationsInvalidation = false
let pendingTicketsInvalidation = false
let pendingDashboardInvalidation = false
const pendingGroupQueueIds = new Set<number>()
let firstPendingAt = 0
let lastFlushAt = 0

function flushRealtimeInvalidation() {
  invalidationTimer = null
  const client = invalidationQueryClient
  const tickets = pendingTicketsInvalidation
  const dashboard = pendingDashboardInvalidation
  const notifications = pendingNotificationsInvalidation
  const groupQueueIds = Array.from(pendingGroupQueueIds)
  pendingTicketsInvalidation = false
  pendingDashboardInvalidation = false
  pendingNotificationsInvalidation = false
  pendingGroupQueueIds.clear()
  firstPendingAt = 0
  if (!client || (!tickets && !dashboard && !notifications && groupQueueIds.length === 0)) return

  lastFlushAt = Date.now()

  if (tickets) {
    void client.invalidateQueries({ queryKey: queryKeys.tickets.all }, { cancelRefetch: false })
  } else if (groupQueueIds.length > 0) {
    // H-41 Golden Rule 1: For TicketCreated, invalidate ONLY the affected group's queue
    for (const gid of groupQueueIds) {
      void client.invalidateQueries(
        { queryKey: queryKeys.tickets.byGroupQueue(gid) },
        { cancelRefetch: false },
      )
    }
  }

  if (dashboard) {
    void client.invalidateQueries({ queryKey: ['dashboard'] }, { cancelRefetch: false })
    void client.invalidateQueries({ queryKey: ['groups', 'dashboard'] }, { cancelRefetch: false })
    void client.invalidateQueries({ queryKey: ['admin', 'dashboard'] }, { cancelRefetch: false })
  }
  if (notifications) {
    void client.invalidateQueries({ queryKey: ['notifications'] }, { cancelRefetch: false })
  }
}

/**
 * Coalesces realtime-driven invalidations (trailing debounce with a max wait and a
 * minimum spacing between flushes).
 */
export function scheduleRealtimeInvalidation(
  client: QueryClient,
  scope: {
    tickets?: boolean
    groupQueueId?: number
    dashboard?: boolean
    notifications?: boolean
  },
) {
  invalidationQueryClient = client
  if (scope.tickets) pendingTicketsInvalidation = true
  if (scope.groupQueueId && scope.groupQueueId > 0) pendingGroupQueueIds.add(scope.groupQueueId)
  if (scope.dashboard) pendingDashboardInvalidation = true
  if (scope.notifications) pendingNotificationsInvalidation = true

  const now = Date.now()
  if (firstPendingAt === 0) firstPendingAt = now

  if (invalidationTimer !== null) clearTimeout(invalidationTimer)

  const untilMaxWait = Math.max(0, firstPendingAt + REALTIME_INVALIDATION_MAX_WAIT_MS - now)
  const untilMinInterval = Math.max(0, lastFlushAt + REALTIME_INVALIDATION_MIN_INTERVAL_MS - now)
  const delay = Math.max(
    untilMinInterval,
    Math.min(REALTIME_INVALIDATION_DEBOUNCE_MS, untilMaxWait),
  )
  invalidationTimer = setTimeout(flushRealtimeInvalidation, delay)
}

/** Drops any pending invalidation (logout / connection teardown). */
function cancelRealtimeInvalidation() {
  if (invalidationTimer !== null) {
    clearTimeout(invalidationTimer)
    invalidationTimer = null
  }
  pendingTicketsInvalidation = false
  pendingDashboardInvalidation = false
  pendingNotificationsInvalidation = false
  pendingGroupQueueIds.clear()
  firstPendingAt = 0
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

export async function stopRealtimeConnection(): Promise<void> {
  const connection = sharedConnection
  sharedConnection = null
  sharedToken = null
  clearNegotiationRetry()
  cancelRealtimeInvalidation()

  if (!connection) return

  const pending = pendingStart
  if (pending) {
    await Promise.race([
      pending,
      new Promise((resolve) => setTimeout(resolve, REALTIME_STOP_TIMEOUT_MS)),
    ])
  }

  try {
    await connection.stop()
  } catch {
    // The connection may already be closed: nothing else to do.
  }
  updateConnectionState('disconnected')
}

export function useRealtimeConnectionState(): ConnectionState {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>(currentConnectionState)

  useEffect(() => {
    stateListeners.add(setConnectionState)
    setConnectionState(currentConnectionState)
    return () => {
      stateListeners.delete(setConnectionState)
    }
  }, [])

  return connectionState
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
      onNotificationReceived: () =>
        optionsRef.current?.onNotificationReceived?.(),
    }
    activeListeners.add(listener)
    return () => {
      activeListeners.delete(listener)
    }
  }, [options != null]) // eslint-disable-line react-hooks/exhaustive-deps

  // Suscripción dinámica al grupo cuando cambia el groupId en la UI
  useEffect(() => {
    const gid = options?.groupId
    if (gid && gid > 0) {
      subscribedGroupIds.add(gid)
      if (sharedConnection && currentConnectionState === 'connected') {
        sharedConnection.invoke('SubscribeToGroup', gid).catch(() => {})
      }
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

    let disposed = false

    const startConnection = (connection: HubConnection) => {
      if (disposed) return
      updateConnectionState('connecting')

      const start = connection.start()

      const settled = start.then(
        () => undefined,
        () => undefined,
      )
      pendingStart = settled
      void settled.then(() => {
        if (pendingStart === settled) pendingStart = null
      })

      start
        .then(() => {
          if (disposed) return
          clearNegotiationRetry()
          updateConnectionState('connected')
          const initialGroup = optionsRef.current?.groupId
          if (initialGroup && initialGroup > 0) {
            subscribedGroupIds.add(initialGroup)
          }
          const groupsToSubscribe =
            subscribedGroupIds.size > 0 ? Array.from(subscribedGroupIds) : [1]
          groupsToSubscribe.forEach((gid) => {
            connection.invoke('SubscribeToGroup', gid).catch(() => {})
          })
        })
        .catch((err) => {
          if (disposed) return
          if (isAbortError(err)) {
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

      // H-41 Point 2 & 3:
      // - TicketCreated: invalidate ONLY the affected group's queue + show toast
      connection.on('TicketCreated', (payload: TicketCreatedPayload) => {
        const targetGroupId =
          payload.groupId && payload.groupId > 0
            ? payload.groupId
            : optionsRef.current?.groupId ?? 1

        void queryClient.invalidateQueries(
          { queryKey: queryKeys.tickets.byGroupQueue(targetGroupId) },
          { cancelRefetch: false },
        )
        scheduleRealtimeInvalidation(queryClient, {
          groupQueueId: targetGroupId,
          dashboard: true,
          notifications: true,
        })

        useToastStore.getState().push({
          title: `Nuevo ticket #${payload.ticketId} en tu cola`,
          description: 'Se ha recibido un nuevo ticket en la cola del grupo.',
          variant: 'info',
        })

        activeListeners.forEach((l) =>
          l.onTicketCreated?.(payload.ticketId, payload.groupId),
        )
      })

      // - TicketClaimed / TicketAssigned: remove from group queue via setQueryData + invalidate assignee list
      const handleTicketClaimed = (payload: TicketClaimedPayload) => {
        queryClient.setQueriesData<PagedResult<TicketSummary>>(
          { queryKey: queryKeys.tickets.byGroupQueue(payload.groupId) },
          (old) => {
            if (!old || !Array.isArray(old.items)) return old
            const filtered = old.items.filter((t) => t.id !== payload.ticketId)
            return {
              ...old,
              items: filtered,
              total: Math.max(0, (old.total ?? filtered.length + 1) - 1),
            }
          },
        )
        if (payload.assignedUserId > 0) {
          void queryClient.invalidateQueries(
            { queryKey: queryKeys.tickets.byAssignee(payload.assignedUserId) },
            { cancelRefetch: false },
          )
        }
        scheduleRealtimeInvalidation(queryClient, {
          dashboard: true,
          notifications: true,
        })

        const currentUserId = useAuthStore.getState().user?.userId
        if (currentUserId && Number(currentUserId) === Number(payload.assignedUserId)) {
          const existing = useToastStore.getState().toasts
          if (!existing.some((t) => t.description?.includes(`#${payload.ticketId}`) || t.title.includes(`#${payload.ticketId}`))) {
            useToastStore.getState().push({
              title: `Te has asignado el ticket #${payload.ticketId}`,
              variant: 'success',
            })
          }
        }

        activeListeners.forEach((l) =>
          l.onTicketClaimed?.(payload.ticketId, payload.groupId),
        )
      }

      connection.on('TicketClaimed', handleTicketClaimed)
      connection.on('TicketAssigned', handleTicketClaimed)

      // - TicketStatusChanged: use queryClient.setQueryData to move the card immediately (Golden Rule 1)
      connection.on('TicketStatusChanged', (payload: TicketStatusChangedPayload) => {
        applyOptimisticTicketStatusUpdate(queryClient, payload)
        scheduleRealtimeInvalidation(queryClient, {
          dashboard: true,
          notifications: true,
        })

        const statusLabel = getStatusLabel(payload.newStatus)
        const existing = useToastStore.getState().toasts
        const alreadyShown = existing.some(
          (t) =>
            t.title.includes(`#${payload.ticketId}`) ||
            (t.description?.includes(`#${payload.ticketId}`) ?? false),
        )
        if (!alreadyShown) {
          useToastStore.getState().push({
            title: `El ticket #${payload.ticketId} pasó a ${statusLabel}`,
            variant: 'info',
          })
        }

        activeListeners.forEach((l) =>
          l.onTicketStatusChanged?.(payload.ticketId, payload.newStatus),
        )
      })

      connection.on('SolutionAdded', () => {
        scheduleRealtimeInvalidation(queryClient, { dashboard: true })
      })

      connection.on('NotificationReceived', () => {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] })
        const existing = useToastStore.getState().toasts
        if (!existing.some((t) => t.title.includes('Nuevo ticket') || t.title.includes('nueva notificación'))) {
          useToastStore.getState().push({
            title: 'Tienes una nueva notificación',
            variant: 'info',
          })
        }
        activeListeners.forEach((l) => l.onNotificationReceived?.())
      })

      connection.onreconnecting(() => {
        updateConnectionState('reconnecting')
      })
      connection.onreconnected(async () => {
        updateConnectionState('connected')

        // Re-subscribe to all active groups upon reconnection (H-41 Point 2.2)
        const initialGroup = optionsRef.current?.groupId
        if (initialGroup && initialGroup > 0) {
          subscribedGroupIds.add(initialGroup)
        }
        const groupsToSubscribe =
          subscribedGroupIds.size > 0 ? Array.from(subscribedGroupIds) : [1]
        for (const gid of groupsToSubscribe) {
          try {
            await connection.invoke('SubscribeToGroup', gid)
          } catch (error) {
            console.warn('SignalR: could not re-subscribe to group', gid, error)
          }
        }

        // General invalidateQueries on reconnect to recover missed state
        scheduleRealtimeInvalidation(queryClient, {
          tickets: true,
          dashboard: true,
          notifications: true,
        })
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
