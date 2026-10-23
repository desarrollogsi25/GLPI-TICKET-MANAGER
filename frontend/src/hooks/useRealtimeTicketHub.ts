import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr'
import { useEffect, useRef, useState } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { queryKeys } from '@/lib/api/queryKeys'

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
 *
 * BUG-032 / H-32: the logout flow used to revoke the JWT while the WebSocket upgrade
 * was still on the wire. The server answered that upgrade with `401` and the browser
 * reported "HTTP Authentication failed" in the console. Keeping a handle on the
 * handshake lets the logout flow close the socket on a clean boundary instead.
 */
let pendingStart: Promise<void> | null = null

function clearNegotiationRetry() {
  if (negotiationRetryTimer !== null) {
    clearTimeout(negotiationRetryTimer)
    negotiationRetryTimer = null
  }
}

/**
 * Quiet period after the LAST realtime event before the caches are invalidated.
 *
 * BUG-032 / H-36: every SignalR event used to call `invalidateQueries` right away. A
 * burst of N events therefore refetched `GET /tickets/by-group` N times (several
 * invalidations per event, and TanStack cancels + restarts an in-flight refetch by
 * default), draining the `Expensive` token bucket (20 req/min, 1 token / 3 s) and
 * producing 429. Events now only mark the caches as dirty; one trailing flush runs
 * once the burst has settled.
 */
export const REALTIME_INVALIDATION_DEBOUNCE_MS = 800
/**
 * Upper bound on how long a continuous stream of events can postpone the flush, so a
 * busy board still refreshes at least this often instead of starving.
 */
export const REALTIME_INVALIDATION_MAX_WAIT_MS = 3000
/** Minimum spacing between two flushes: caps the realtime refetch rate at ~1/s. */
const REALTIME_INVALIDATION_MIN_INTERVAL_MS = 1000

let invalidationTimer: ReturnType<typeof setTimeout> | null = null
let invalidationQueryClient: QueryClient | null = null
const subscribedGroupIds = new Set<number>()
let pendingNotificationsInvalidation = false
let pendingTicketsInvalidation = false
let pendingDashboardInvalidation = false
let firstPendingAt = 0
let lastFlushAt = 0

function flushRealtimeInvalidation() {
  invalidationTimer = null
  const client = invalidationQueryClient
  const tickets = pendingTicketsInvalidation
  const dashboard = pendingDashboardInvalidation
  const notifications = pendingNotificationsInvalidation
  pendingTicketsInvalidation = false
  pendingDashboardInvalidation = false
  pendingNotificationsInvalidation = false
  firstPendingAt = 0
  if (!client || (!tickets && !dashboard && !notifications)) return

  lastFlushAt = Date.now()
  // `queryKeys.tickets.all` is a prefix of the detail, list, assignee and group-queue
  // keys, so ONE invalidation covers them all. `cancelRefetch: false` keeps an
  // in-flight request instead of cancelling it and firing a duplicate.
  if (tickets) {
    void client.invalidateQueries({ queryKey: queryKeys.tickets.all }, { cancelRefetch: false })
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
  scope: { tickets?: boolean; dashboard?: boolean; notifications?: boolean },
) {
  invalidationQueryClient = client
  if (scope.tickets) pendingTicketsInvalidation = true
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

/**
 * Stops the shared realtime connection, waiting for a pending handshake to settle.
 *
 * BUG-032 / H-32: the session must be closed in the right order. The logout flow
 * revokes the JWT, so any WebSocket upgrade still in flight would be rejected with
 * `401` and the browser would log the failure as a console error the user never
 * caused. Closing the socket FIRST removes that window.
 *
 * The handshake is awaited instead of being aborted on purpose: aborting a WebSocket
 * mid-upgrade makes the browser log "WebSocket is closed before the connection was
 * established", which is exactly the noise this function exists to remove.
 */
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

/**
 * Subscribes to the state of the shared connection WITHOUT taking part in its
 * lifecycle.
 *
 * `useRealtimeTicketHub` opens and closes the connection (it is reference counted),
 * so components that only need to know whether realtime is alive use this hook
 * instead. BUG-032 / H-32: the Kanban queue query reads this state to decide between
 * "trust SignalR" and "fall back to polling".
 */
export function useRealtimeConnectionState(): ConnectionState {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>(currentConnectionState)

  useEffect(() => {
    stateListeners.add(setConnectionState)
    // The shared connection may have changed state between the render and this
    // effect (e.g. it connected while this component was mounting).
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

    // Generation guard: any async callback created by this effect (negotiation retry,
    // start().then/catch) becomes a no-op once the effect is torn down. This is what
    // prevents the "AbortError: The connection was stopped during negotiation" from
    // surfacing when a component mounts/unmounts quickly (React 19 StrictMode, route
    // transitions or a token refresh).
    let disposed = false

    const startConnection = (connection: HubConnection) => {
      if (disposed) return
      updateConnectionState('connecting')

      const start = connection.start()

      // BUG-032: keep a handle on the handshake so `stopRealtimeConnection()` can wait
      // for it to settle instead of aborting a WebSocket upgrade mid-flight.
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
          const groupsToSubscribe = subscribedGroupIds.size > 0 ? Array.from(subscribedGroupIds) : [1]
          groupsToSubscribe.forEach((gid) => {
            connection.invoke('SubscribeToGroup', gid).catch(() => {})
          })
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
      // H-36 / H-40: handlers mark caches dirty; the refetch is debounced (see
      // `scheduleRealtimeInvalidation`) so an event burst yields a single request.
      connection.on('TicketCreated', (payload: TicketCreatedPayload) => {
        scheduleRealtimeInvalidation(queryClient, {
          tickets: true,
          dashboard: true,
          notifications: true,
        })
        activeListeners.forEach((l) =>
          l.onTicketCreated?.(payload.ticketId, payload.groupId),
        )
      })

      connection.on('TicketClaimed', (payload: TicketClaimedPayload) => {
        scheduleRealtimeInvalidation(queryClient, {
          tickets: true,
          dashboard: true,
          notifications: true,
        })
        activeListeners.forEach((l) =>
          l.onTicketClaimed?.(payload.ticketId, payload.groupId),
        )
      })

      connection.on('TicketStatusChanged', (payload: TicketStatusChangedPayload) => {
        scheduleRealtimeInvalidation(queryClient, {
          tickets: true,
          dashboard: true,
          notifications: true,
        })
        activeListeners.forEach((l) =>
          l.onTicketStatusChanged?.(payload.ticketId, payload.newStatus),
        )
      })

      connection.on('SolutionAdded', () => {
        scheduleRealtimeInvalidation(queryClient, { tickets: true, dashboard: true })
      })

      connection.on('NotificationReceived', () => {
        void queryClient.invalidateQueries({ queryKey: ['notifications'] })
        activeListeners.forEach((l) => l.onNotificationReceived?.())
      })

      connection.onreconnecting(() => {
        updateConnectionState('reconnecting')
      })
      connection.onreconnected(async () => {
        updateConnectionState('connected')

        // A reconnected SignalR connection starts with NO group membership: the server
        // dropped the subscription when the socket went down. Without re-joining, the
        // board would silently stop receiving events for the group it is showing.
        const initialGroup = optionsRef.current?.groupId
        if (initialGroup && initialGroup > 0) {
          subscribedGroupIds.add(initialGroup)
        }
        const groupsToSubscribe = subscribedGroupIds.size > 0 ? Array.from(subscribedGroupIds) : [1]
        for (const gid of groupsToSubscribe) {
          try {
            await connection.invoke('SubscribeToGroup', gid)
          } catch (error) {
            console.warn('SignalR: could not re-subscribe to group', gid, error)
          }
        }

        // Events raised while the socket was down were never delivered. Reconciling
        // the cached queue with the server closes that gap without resorting to the
        // aggressive polling this incident removed (debounced like any other event).
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
