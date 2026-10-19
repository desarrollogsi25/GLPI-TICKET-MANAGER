import { useAuthStore } from '@/store/authStore'

export function useRole() {
  const role = useAuthStore((s) => s.role ?? s.user?.role ?? 'technician')
  return {
    role,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    isTechnician: role === 'technician',
    isSolicitante: role === 'solicitante',
  }
}
