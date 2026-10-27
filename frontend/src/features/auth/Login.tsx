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
import { cn } from '@/lib/utils'
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#1C1917] p-4 overflow-hidden">
      <div className="opacity-60">
        <LoginBackground />
      </div>
      <Card className="relative z-10 w-full max-w-sm rounded-3xl bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-serif tracking-tight text-foreground">
            GLPI Ticket Manager
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Accede con tu cuenta de GLPI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">
                Usuario
              </Label>
              <Input
                id="username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? 'username-error' : undefined}
                className={cn(
                  'h-10 rounded-xl bg-white/5 dark:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary border-none shadow-xs text-sm',
                  errors.username && 'ring-2 ring-destructive',
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
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={cn(
                  'h-10 rounded-xl bg-white/5 dark:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary border-none shadow-xs text-sm',
                  errors.password && 'ring-2 ring-destructive',
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
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {getApiErrorMessage(login.error)}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full h-10 rounded-xl active:scale-95 transition-all duration-150 font-medium shadow-sm"
              disabled={hasErrors || login.isPending}
            >
              {login.isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
