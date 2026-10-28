import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'motion/react'
import { Lock, User, ShieldCheck, Activity, Zap } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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

const EASE = [0.23, 1, 0.32, 1] as const

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
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-muted to-background text-foreground">
      {/* Ola: capas SVG con borde derecho curvo (desktop) */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] md:block"
      >
        <svg
          className="absolute inset-0 h-full w-full text-primary"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L84,0 C100,18 62,34 80,52 C97,70 68,86 86,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.07"
          />
          <path
            d="M0,0 L72,0 C90,16 54,36 70,54 C86,72 58,88 74,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path
            d="M0,0 L58,0 C76,18 42,38 56,56 C70,74 46,90 60,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.14"
          />
        </svg>
      </motion.div>

      {/* Ola móvil: banda superior curva */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="pointer-events-none absolute inset-x-0 top-0 h-56 md:hidden"
      >
        <svg className="h-full w-full text-primary" viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,22 C75,40 40,8 0,28 Z" fill="currentColor" fillOpacity="0.12" />
          <path d="M0,0 L100,0 L100,12 C70,30 35,0 0,18 Z" fill="currentColor" fillOpacity="0.14" />
        </svg>
      </motion.div>

      {/* Panel de marca sobre la ola (solo desktop) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
        className="relative z-10 hidden w-1/2 flex-col justify-between p-10 lg:p-14 md:flex select-none"
      >
        <div className="inline-flex w-fit items-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-black/5">
          <img src="/logo-gsi.png" alt="GSI Service Desk" className="h-14 w-auto" width={480} height={320} />
        </div>

        <div className="max-w-md space-y-5">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-foreground lg:text-4xl">
            Gestiona tus tickets con claridad.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Atención al usuario en tiempo real, sincronizada con GLPI 11 y tableros ágiles para tu equipo.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: Activity, label: 'Tiempo real' },
              { icon: ShieldCheck, label: 'Acceso por rol' },
              { icon: Zap, label: 'Flujo ágil' },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/60 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md"
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} GSI Service Desk</p>
      </motion.div>

      {/* Formulario */}
      <div className="relative z-10 flex flex-1 items-center justify-center p-4 pt-24 sm:p-8 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
          className="w-full max-w-sm space-y-6 rounded-3xl border border-border/40 bg-background/80 p-8 shadow-2xl backdrop-blur-md"
        >
          <div className="space-y-3">
            <img
              src="/isotipo-gsi.png"
              alt="GSI"
              className="size-12 rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 md:hidden"
              width={256}
              height={256}
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Iniciar sesión</h1>
              <p className="text-sm text-muted-foreground">Accede con tu cuenta de GLPI.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">
                Usuario
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <User className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="ej. tech1"
                  aria-invalid={Boolean(errors.username)}
                  aria-describedby={errors.username ? 'username-error' : undefined}
                  className={cn(
                    'h-10 rounded-xl border-border/80 bg-background pl-9 transition-colors focus-visible:ring-1 focus-visible:ring-primary',
                    errors.username && 'border-destructive focus-visible:ring-destructive',
                  )}
                  {...register('username')}
                />
              </div>
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
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={cn(
                    'h-10 rounded-xl border-border/80 bg-background pl-9 transition-colors focus-visible:ring-1 focus-visible:ring-primary',
                    errors.password && 'border-destructive focus-visible:ring-destructive',
                  )}
                  {...register('password')}
                />
              </div>
              {errors.password ? (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {login.isError ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
              >
                {getApiErrorMessage(login.error)}
              </div>
            ) : null}

            <Button
              type="submit"
              className="mt-2 h-10 w-full cursor-pointer rounded-xl bg-primary text-xs font-semibold text-primary-foreground shadow-md transition-all duration-150 hover:bg-primary/90 active:scale-[0.98]"
              disabled={hasErrors || login.isPending}
            >
              {login.isPending ? 'Iniciando sesión…' : 'Iniciar Sesión'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
