import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, Radio, ShieldCheck, User, Workflow } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLoginMutation } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

type LoginFormValues = z.infer<typeof loginSchema>

interface LocationState {
  from?: string
}

const isAllowedRouteForRole = (path: string, userRole?: string): boolean => {
  if (['/tickets', '/preferences', '/ayuda'].some((p) => path === p || path.startsWith(p + '/'))) return true
  if (!userRole || userRole === 'solicitante') return false
  if (['/kanban', '/queue', '/dashboard', '/services'].some((p) => path === p || path.startsWith(p + '/'))) return true
  if (path === '/equipo' || path.startsWith('/equipo/')) return userRole === 'supervisor' || userRole === 'admin'
  if (path === '/administracion' || path.startsWith('/administracion/')) return userRole === 'admin'
  return false
}

const CAPABILITIES = [
  {
    icon: Radio,
    title: 'Sincronización en tiempo real',
    desc: 'Colas de soporte, asignaciones y estados actualizados al instante vía SignalR.',
  },
  {
    icon: Workflow,
    title: 'Flujo nativo ITIL sobre GLPI 11',
    desc: 'Cada planificación, tarea y solución queda auditada en el motor oficial de GLPI.',
  },
  {
    icon: ShieldCheck,
    title: 'Control estricto por rol y grupo',
    desc: 'Vistas dedicadas para solicitantes, técnicos, supervisores y administradores.',
  },
] as const

export function Login() {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.user?.role ?? state.role)
  const login = useLoginMutation()
  const navigate = useNavigate()
  const location = useLocation()
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
        const isDifferentUser = Boolean(lastUser && lastUser.toLowerCase() !== data.user.username.toLowerCase())

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
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-12 bg-background text-foreground">
      {/* Left Enterprise Brand Panel (Desktop) */}
      <aside className="hidden md:flex md:col-span-6 lg:col-span-7 flex-col justify-between bg-slate-950 text-slate-100 p-10 lg:p-14 border-r border-slate-800 relative overflow-hidden">
        {/* Subtle precision grid background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm">
            <img src="/logo-gsi.png" alt="GSI Service Desk" className="h-10 w-auto" width={480} height={320} />
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
              IT Service Management · GLPI 11
            </p>
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-white leading-tight">
              Gestión operativa de soporte con precisión y trazabilidad.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Centraliza el seguimiento, asignación, planificación de tareas y resolución de tickets en tiempo real directamente conectado con GLPI.
            </p>
          </div>

          <ul className="space-y-4 pt-2">
            {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-sky-400 mt-0.5">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-5">
          <span>GSI Service Desk · Mesa de Ayuda Corporativa</span>
          <span className="font-mono text-slate-500">GLPI 11.0</span>
        </div>
      </aside>

      {/* Right Authentication Column */}
      <main className="md:col-span-6 lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-3 md:hidden pb-2 border-b border-border">
            <img
              src="/isotipo-gsi.png"
              alt="GSI Service Desk"
              className="size-10 rounded-lg bg-white p-1 border border-border"
              width={256}
              height={256}
            />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">GSI Service Desk</p>
              <p className="text-xs text-muted-foreground">GLPI Ticket Manager</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Iniciar sesión</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa con tus credenciales corporativas de GLPI.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
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
                    placeholder="Nombre de usuario GLPI"
                    aria-invalid={Boolean(isSubmitted && errors.username)}
                    aria-describedby={isSubmitted && errors.username ? 'username-error' : undefined}
                    className={cn(
                      'h-10 rounded-lg pl-9',
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
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                    <Lock className="size-4" aria-hidden="true" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(isSubmitted && errors.password)}
                    aria-describedby={isSubmitted && errors.password ? 'password-error' : undefined}
                    className={cn(
                      'h-10 rounded-lg pl-9 pr-10',
                      isSubmitted && errors.password && 'border-destructive focus-visible:ring-destructive',
                    )}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground cursor-pointer rounded-r-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
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
                  className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive font-medium"
                >
                  Credenciales incorrectas o usuario no autorizado. Verifica tus datos en GLPI.
                </div>
              ) : null}

              <Button
                type="submit"
                loading={login.isPending}
                className="mt-2 h-10 w-full cursor-pointer rounded-lg text-sm font-semibold"
                disabled={login.isPending}
              >
                {login.isPending ? 'Iniciando sesión…' : 'Iniciar Sesión'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            Los tickets nuevos se crean desde el portal corporativo de GLPI y se gestionan aquí con tu mismo usuario.
          </p>
        </div>
      </main>
    </div>
  )
}
