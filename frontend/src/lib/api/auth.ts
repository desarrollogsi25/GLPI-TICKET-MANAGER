import { apiClient } from '@/lib/apiClient'
import type { LoginRequest, LoginResponse, UserProfile } from '@/lib/api/types'
import { stopRealtimeConnection } from '@/hooks/useRealtimeTicketHub'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
  return data
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/auth/me')
  return data
}

export async function logout(): Promise<void> {
  // BUG-032 / H-32: the session must be closed in order. The realtime socket is
  // closed BEFORE the token is revoked, so a WebSocket upgrade still in flight is
  // never answered with "401 Unauthorized" (which the browser reports as a console
  // error the user did not cause).
  await stopRealtimeConnection()
  await apiClient.post('/auth/logout')
}
