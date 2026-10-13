import { apiClient } from '@/lib/apiClient'
import type { LoginRequest, LoginResponse, UserProfile } from '@/lib/api/types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
  return data
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/auth/me')
  return data
}
