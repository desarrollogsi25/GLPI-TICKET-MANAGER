import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/toast'
import { Login } from '@/features/auth/Login'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { AgentGuide } from '@/features/help/AgentGuide'
import { PreferencesPage } from '@/features/preferences/PreferencesPage'
import { ServicesPage } from '@/features/services/ServicesPage'
import { GroupQueuePage } from '@/features/tickets/GroupQueuePage'
import { Detail } from '@/features/tickets/Detail'
import { Kanban } from '@/features/tickets/Kanban'
import { List } from '@/features/tickets/List'
import { usePreferencesQuery } from '@/hooks/usePreferences'
import { useAuthStore } from '@/store/authStore'

function GlobalThemeSync() {
  const token = useAuthStore((s) => s.token)
  const { data } = usePreferencesQuery()

  useEffect(() => {
    if (!token) {
      document.documentElement.removeAttribute('data-theme')
      return
    }
    if (data?.prefs) {
      try {
        const parsed = JSON.parse(data.prefs)
        if (parsed?.theme) {
          document.documentElement.setAttribute('data-theme', parsed.theme)
        }
      } catch {
        // ignore
      }
    }
  }, [token, data?.prefs])

  return null
}

export default function App() {
  return (
    <>
      <GlobalThemeSync />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/kanban" replace />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/tickets" element={<List />} />
          <Route path="/tickets/:id" element={<Detail />} />
          <Route path="/queue" element={<GroupQueuePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ayuda" element={<AgentGuide />} />

        </Route>

        <Route path="*" element={<Navigate to="/kanban" replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
