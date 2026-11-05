import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ProtectedRouteWithRole } from '@/components/layout/ProtectedRouteWithRole'
import { Toaster } from '@/components/ui/toast'
import { Login } from '@/features/auth/Login'
import { AdminDashboard } from '@/features/dashboard/AdminDashboard'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { TeamDashboard } from '@/features/dashboard/TeamDashboard'
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
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') {
      if (stored === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.setAttribute('data-theme', 'light')
      }
      return
    }

    if (!token) return

    if (data?.prefs) {
      try {
        const parsed = JSON.parse(data.prefs)
        if (parsed?.theme === 'dark') {
          localStorage.setItem('theme', 'dark')
          document.documentElement.classList.add('dark')
          document.documentElement.setAttribute('data-theme', 'dark')
        } else if (parsed?.theme === 'light') {
          localStorage.setItem('theme', 'light')
          document.documentElement.classList.remove('dark')
          document.documentElement.setAttribute('data-theme', 'light')
        }
      } catch {
        // ignore
      }
    }
  }, [token, data?.prefs])

  return null
}

function RootRedirect() {
  const role = useAuthStore((state) => state.user?.role ?? state.role)
  return <Navigate to={role === 'solicitante' ? '/tickets' : '/kanban'} replace />
}

function DemoEnvironmentBanner() {
  const isDemo =
    import.meta.env.VITE_DEMO_BANNER === 'true' ||
    (typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-demo-banner') === 'true')

  if (!isDemo) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="demo-environment-banner"
      className="fixed top-0 left-1/2 -translate-x-1/2 z-50 rounded-b-lg bg-amber-500 text-slate-950 px-3 py-0.5 text-center text-[10px] font-bold uppercase tracking-wider shadow-sm pointer-events-none select-none whitespace-nowrap"
    >
      ENTORNO DE DEMOSTRACIÓN — NO PRODUCCIÓN
    </div>
  )
}

export default function App() {
  return (
    <>
      <GlobalThemeSync />
      <DemoEnvironmentBanner />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RootRedirect />} />
          <Route
            path="/kanban"
            element={
              <ProtectedRouteWithRole allowedRoles={['technician', 'supervisor', 'admin']}>
                <Kanban />
              </ProtectedRouteWithRole>
            }
          />
          <Route path="/tickets" element={<List />} />
          <Route path="/tickets/:id" element={<Detail />} />
          <Route
            path="/queue"
            element={
              <ProtectedRouteWithRole allowedRoles={['technician', 'supervisor', 'admin']}>
                <GroupQueuePage />
              </ProtectedRouteWithRole>
            }
          />
          <Route
            path="/services"
            element={
              <ProtectedRouteWithRole allowedRoles={['technician', 'supervisor', 'admin']}>
                <ServicesPage />
              </ProtectedRouteWithRole>
            }
          />
          <Route path="/preferences" element={<PreferencesPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRouteWithRole allowedRoles={['technician', 'supervisor', 'admin']}>
                <Dashboard />
              </ProtectedRouteWithRole>
            }
          />
          <Route
            path="/equipo"
            element={
              <ProtectedRouteWithRole allowedRoles={['supervisor', 'admin']}>
                <TeamDashboard />
              </ProtectedRouteWithRole>
            }
          />
          <Route
            path="/administracion"
            element={
              <ProtectedRouteWithRole allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRouteWithRole>
            }
          />
          <Route path="/ayuda" element={<AgentGuide />} />

        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>

      <Toaster />
    </>
  )
}
