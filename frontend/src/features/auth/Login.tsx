import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, useReducedMotion } from 'motion/react'
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoginMutation } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
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

const isAllowedRouteForRole = (path: string, userRole?: string): boolean => {
  if (['/tickets', '/preferences', '/ayuda'].some((p) => path === p || path.startsWith(p + '/'))) return true
  if (!userRole || userRole === 'solicitante') return false
  if (['/kanban', '/queue', '/dashboard', '/services'].some((p) => path === p || path.startsWith(p + '/'))) return true
  if (path === '/equipo' || path.startsWith('/equipo/')) return userRole === 'supervisor' || userRole === 'admin'
  if (path === '/administracion' || path.startsWith('/administracion/')) return userRole === 'admin'
  return false
}

export function Login() {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.user?.role ?? state.role)
  const login = useLoginMutation()
  const navigate = useNavigate()
  const location = useLocation()
  const prefersReduced = useReducedMotion()
  const [showPassword, setShowPassword] = useState(false)
  const homePath = role === 'solicitante' ? '/tickets' : '/kanban'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { username: '', password: '' },
  })

  if (token) {
    return <Navigate to={homePath} replace />
  }

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: (data) => {
        const state = location.state as LocationState | null
        const destination = data.user.role === 'solicitante' ? '/tickets' : '/kanban'

        const lastUser = localStorage.getItem('glpi_last_username')
        localStorage.setItem('glpi_last_username', data.user.username)
        const isDifferentUser = Boolean(
          lastUser && lastUser.toLowerCase() !== data.user.username.toLowerCase(),
        )

        const rawFrom = state?.from?.split('?')[0]
        const isResourceDetail = rawFrom ? /^\/tickets\/\d+/i.test(rawFrom) : false

        let target = destination
        if (
          !isDifferentUser &&
          !isResourceDetail &&
          rawFrom &&
          rawFrom.startsWith('/') &&
          !rawFrom.startsWith('//') &&
          isAllowedRouteForRole(rawFrom, data.user.role)
        ) {
          target = rawFrom
        } else if (
          isDifferentUser &&
          rawFrom &&
          rawFrom.startsWith('/') &&
          !rawFrom.startsWith('//') &&
          !isResourceDetail &&
          isAllowedRouteForRole(rawFrom, data.user.role)
        ) {
          target = rawFrom
        }

        navigate(target, { replace: true })
      },
    })
  })

  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#f3f5f8] via-[#edf0f5] to-[#f8fafc] dark:from-[#0b1120] dark:via-[#11192c] dark:to-[#0b1120] text-foreground">
      {/* Organic layered wave backdrop (desktop — preserves reference composition) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReduced ? false : { opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.45, ease: EASE }}
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] md:block"
      >
        <svg
          className="absolute inset-0 h-full w-full text-slate-900 dark:text-sky-300"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L84,0 C100,18 62,34 80,52 C97,70 68,86 86,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.045"
          />
          <path
            d="M0,0 L72,0 C90,16 54,36 70,54 C86,72 58,88 74,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.065"
          />
          <path
            d="M0,0 L58,0 C76,18 42,38 56,56 C70,74 46,90 60,100 L0,100 Z"
            fill="currentColor"
            fillOpacity="0.085"
          />
        </svg>
      </motion.div>

      {/* Subtle curved wave header (mobile) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.35, ease: EASE }}
        className="pointer-events-none absolute inset-x-0 top-0 h-52 md:hidden"
      >
        <svg
          className="h-full w-full text-slate-900 dark:text-sky-300"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L100,0 L100,22 C75,40 40,8 0,28 Z" fill="currentColor" fillOpacity="0.06" />
          <path d="M0,0 L100,0 L100,12 C70,30 35,0 0,18 Z" fill="currentColor" fillOpacity="0.08" />
        </svg>
      </motion.div>

      {/* Left Brand Panel (desktop — preserves logo top-left, welcome center-left, subtle footer) */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReduced ? { duration: 0 } : { duration: 0.45, delay: 0.05, ease: EASE }}
        className="relative z-10 hidden w-1/2 flex-col justify-between p-10 lg:p-14 md:flex select-none"
      >
        <div className="inline-flex w-fit items-center rounded-2xl bg-white px-3.5 py-2.5 shadow-[0_10px_28px_-10px_rgba(15,23,42,0.14)] ring-1 ring-black/[0.05]">
          <img
            src="/logo-gsi.png"
            alt="GSI Service Desk"
            className="h-12 w-auto"
            width={480}
            height={320}
          />
        </div>

        <div className="mx-auto max-w-md space-y-3.5 text-center">
          <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-foreground lg:text-[40px]">
            Bienvenido a GSI Service Desk
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Gestiona tus tickets con claridad y en tiempo real.
          </p>
        </div>

        <p className="text-xs font-medium text-muted-foreground">Service Desk Inteligente</p>
      </motion.div>

      {/* Right Compact Form Card */}
      <main
        id="main-content"
        className="relative z-10 flex flex-1 items-center justify-center p-4 pt-20 sm:p-8 md:pt-8"
      >
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : { type: 'spring', bounce: 0, duration: 0.38 }
          }
          className="w-full max-w-[380px] space-y-6 rounded-[24px] bg-card p-8 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.16),0_2px_6px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.05] dark:ring-white/[0.08]"
        >
          <div className="space-y-3">
            <img
              src="/isotipo-gsi.png"
              alt="GSI Service Desk"
              className="size-11 rounded-xl bg-white p-1 shadow-xs ring-1 ring-black/[0.06] md:hidden"
              width={256}
              height={256}
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-[-0.025em] text-foreground">
                Iniciar sesión
              </h1>
              <p className="text-sm text-muted-foreground">Accede con tu cuenta de GLPI.</p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-medium text-foreground">
                Usuario
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Nombre de usuario GLPI"
                  aria-invalid={Boolean(isSubmitted && errors.username)}
                  aria-describedby={isSubmitted && errors.username ? 'username-error' : undefined}
                  className={cn(
                    'h-10 rounded-xl border-input bg-background/70 pl-9 text-sm transition-colors focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring',
                    isSubmitted && errors.username && 'border-destructive focus-visible:ring-destructive',
                  )}
                  {...register('username')}
                />
              </div>
              {isSubmitted && errors.username ? (
                <p id="username-error" role="alert" className="text-xs font-medium text-destructive">
                  {errors.username.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(isSubmitted && errors.password)}
                  aria-describedby={isSubmitted && errors.password ? 'password-error' : undefined}
                  className={cn(
                    'h-10 rounded-xl border-input bg-background/70 pl-9 pr-10 text-sm transition-colors focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-ring',
                    isSubmitted && errors.password && 'border-destructive focus-visible:ring-destructive',
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {isSubmitted && errors.password ? (
                <p id="password-error" role="alert" className="text-xs font-medium text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {login.isError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Credenciales incorrectas o usuario no autorizado. Verifica tus datos de acceso en GLPI.
                </span>
              </div>
            ) : null}

            <Button
              type="submit"
              className="mt-2 h-10 w-full cursor-pointer rounded-xl text-sm font-semibold shadow-sm transition-transform duration-150 active:scale-[0.98]"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>Iniciando sesión…</span>
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  )
}
