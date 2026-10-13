import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LocationState {
  from?: string
}

export function Login() {
  const token = useAuthStore((state) => state.token)
  const login = useLoginMutation()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  if (token) {
    return <Navigate to="/kanban" replace />
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        const state = location.state as LocationState | null
        navigate(state?.from ?? '/kanban', { replace: true })
      },
    })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">GLPI Ticket Manager</CardTitle>
          <CardDescription>Accede con tu cuenta de GLPI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <Label htmlFor="username">Usuario</Label>
              <Input id="username" autoComplete="username" {...register('username')} />
              {errors.username ? (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password ? (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              ) : null}
            </div>

            {login.isError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs">
                {getApiErrorMessage(login.error)}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
