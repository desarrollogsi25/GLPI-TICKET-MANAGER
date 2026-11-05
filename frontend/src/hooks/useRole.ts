import { useAuthStore } from '@/store/authStore'

export function useRole() {
  // The profile role comes from the API and is authoritative; `state.role` is a
  // fallback for sessions persisted before the profile carried a role.
  const role = useAuthStore((s) => s.user?.role ?? s.role ?? 'technician')
  return {
    role,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor',
    isTechnician: role === 'technician',
    isRequester: role === 'solicitante',
    isStaff: role === 'technician' || role === 'supervisor' || role === 'admin',
  }
}
