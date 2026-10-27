import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLoginMutation } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/store/authStore'
import { LoginBackground } from './LoginBackground'

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
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { username: '', password: '' },
  })

  if (token) {
    return <Navigate to="/kanban" replace />
  }

  const hasErrors = Object.keys(errors).length > 0

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        const state = location.state as LocationState | null
        navigate(state?.from ?? '/kanban', { replace: true })
      },
    })
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-stone-950 p-4 overflow-hidden">
      <LoginBackground />
      <Card className="relative z-10 w-full max-w-sm bg-white/5 dark:bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl p-2">
        <CardHeader>
          <CardTitle className="text-xl font-serif-luxury font-bold tracking-tight text-foreground">GLPI Ticket Manager</CardTitle>
          <CardDescription className="text-muted-foreground/80">Accede con tu cuenta de GLPI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className={cn(
                  'bg-background/50 border-white/10 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary',
                  errors.username && 'border-destructive focus-visible:ring-destructive'
                )}
                {...register('username')}
              />
              {errors.username ? (
                <p id="username-error" role="alert" className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={cn(
                  'bg-background/50 border-white/10 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary',
                  errors.password && 'border-destructive focus-visible:ring-destructive'
                )}
                {...register('password')}
              />
              {errors.password ? (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {login.isError ? (
              <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {getApiErrorMessage(login.error)}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={hasErrors || login.isPending}>
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
