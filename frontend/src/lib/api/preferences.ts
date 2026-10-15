import { apiClient } from '@/lib/apiClient'

export interface UserPreferencesResponse {
  prefs: string
}

export async function fetchPreferences(): Promise<UserPreferencesResponse> {
  const { data } = await apiClient.get<UserPreferencesResponse>('/preferences')
  return data
}

export async function updatePreferences(prefs: object): Promise<void> {
  await apiClient.put('/preferences', { prefs: JSON.stringify(prefs) })
}
