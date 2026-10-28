import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Sparkles, User, ShieldCheck, Activity } from 'lucide-react'
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
    <div className="flex min-h-screen w-full flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* 1. Lado Izquierdo (50% en desktop): Branding visual Split-Screen estilo Apple/Spacer */}
      <div className="relative hidden md:flex md:w-1/2 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-r border-border/40 select-none overflow-hidden">
        {/* Orbes Liquid Glass decorativos de fondo */}
        <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Top: Logo y Marca */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
            GL
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-foreground leading-tight">
              GLPI Manager
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              Enterprise Service Management
            </p>
          </div>
        </div>

        {/* Centro: Mensaje inspirador y características clave */}
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>Workspace Inteligente v2.0</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
              Gestiona tus tickets eficientemente.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Plataforma optimizada de atención al usuario, sincronización bidireccional en tiempo real con GLPI 11 y tableros ágiles para equipos de alto desempeño.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-3 backdrop-blur-sm shadow-xs">
              <Activity className="size-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-foreground">Tiempo real SignalR</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/60 p-3 backdrop-blur-sm shadow-xs">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">Políticas de Acceso ITIL</span>
            </div>
          </div>
        </div>

        {/* Bottom: Footer institucional */}
        <div className="relative z-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} GLPI Ticket Manager. Diseñado con experiencia Liquid Glass.
        </div>
      </div>

      {/* 2. Lado Derecho (50% en desktop, 100% en móvil): Formulario de Login */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-background">
        <AnimatePresence mode="wait">
          <motion.div
            key="login-form-panel"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-sm space-y-6"
          >
            {/* Cabecera del formulario (con logo visible en móvil) */}
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2.5 md:hidden mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md">
                  GL
                </div>
                <span className="text-base font-bold text-foreground">GLPI Manager</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Iniciar Sesión
              </h1>
              <p className="text-xs text-muted-foreground">
                Introduce tus credenciales de GLPI para acceder a tu consola.
              </p>
            </div>

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              {/* Campo Usuario con Icono */}
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
                      'pl-9 rounded-xl bg-background border-border/80 h-10 transition-colors focus-visible:ring-1 focus-visible:ring-primary',
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

              {/* Campo Contraseña con Icono */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Contraseña
                  </Label>
                  <span
                    tabIndex={0}
                    role="button"
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none"
                    onClick={() => {
                      /* Enlace visual informativo */
                      alert('Contacta al administrador del sistema GLPI para restablecer tus credenciales.')
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </span>
                </div>
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
                      'pl-9 rounded-xl bg-background border-border/80 h-10 transition-colors focus-visible:ring-1 focus-visible:ring-primary',
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

              {/* Mensaje de Error de API */}
              {login.isError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive leading-relaxed"
                >
                  {getApiErrorMessage(login.error)}
                </div>
              ) : null}

              {/* Botón Iniciar Sesión Ancho y Destacado */}
              <Button
                type="submit"
                className="w-full h-10 text-xs font-semibold rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all duration-150 active:scale-[0.98] cursor-pointer mt-2"
                disabled={hasErrors || login.isPending}
              >
                {login.isPending ? 'Iniciando sesión…' : 'Iniciar Sesión'}
              </Button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
