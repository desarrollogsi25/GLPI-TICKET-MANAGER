import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Toaster } from '@/components/ui/toast'
import { Login } from '@/features/auth/Login'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { AgentGuide } from '@/features/help/AgentGuide'
import { GroupQueuePage } from '@/features/tickets/GroupQueuePage'
import { Detail } from '@/features/tickets/Detail'
import { Kanban } from '@/features/tickets/Kanban'
import { List } from '@/features/tickets/List'

export default function App() {
  return (
    <>
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ayuda" element={<AgentGuide />} />

        </Route>

        <Route path="*" element={<Navigate to="/kanban" replace />} />
      </Routes>

      <Toaster />
    </>
  )
}
