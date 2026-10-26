import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { ProtectedRouteWithRole } from '@/components/layout/ProtectedRouteWithRole'
import { Toaster } from '@/components/ui/toast'
import { Login } from '@/features/auth/Login'
import { usePreferencesQuery } from '@/hooks/usePreferences'
import { useAuthStore } from '@/store/authStore'

const Kanban = lazy(() => import('@/features/tickets/Kanban').then((m) => ({ default: m.Kanban })))
const TeamDashboard = lazy(() => import('@/features/dashboard/TeamDashboard').then((m) => ({ default: m.TeamDashboard })))
const AdminDashboard = lazy(() => import('@/features/dashboard/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })))
const List = lazy(() => import('@/features/tickets/List').then((m) => ({ default: m.List })))
const Detail = lazy(() => import('@/features/tickets/Detail').then((m) => ({ default: m.Detail })))
const GroupQueuePage = lazy(() => import('@/features/tickets/GroupQueuePage').then((m) => ({ default: m.GroupQueuePage })))
const ServicesPage = lazy(() => import('@/features/services/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const PreferencesPage = lazy(() => import('@/features/preferences/PreferencesPage').then((m) => ({ default: m.PreferencesPage })))
const AgentGuide = lazy(() => import('@/features/help/AgentGuide').then((m) => ({ default: m.AgentGuide })))

function LoadingFallback() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

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
  return <Navigate to="/kanban" replace />
}

export default function App() {
  return (
    <>
      <GlobalThemeSync />
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>

      <Toaster />
    </>
  )
}
