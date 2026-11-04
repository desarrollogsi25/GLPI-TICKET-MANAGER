import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Bell, Check, CheckCircle2, Laptop, Moon, Send, Smartphone, Sun } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import type { DarkPreset } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { usePreferencesQuery, useUpdatePreferencesMutation } from '@/hooks/usePreferences'
import { getApiErrorMessage } from '@/lib/api/errors'
import { apiClient } from '@/lib/apiClient'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

const DARK_PRESET_OPTIONS: Array<{
  id: DarkPreset
  label: string
  bgHex: string
  cardHex: string
  borderHex: string
}> = [
  {
    id: 'midnight',
    label: 'Noche (Slate)',
    bgHex: '#0f172a',
    cardHex: '#1e293b',
    borderHex: '#334155',
  },
  {
    id: 'charcoal',
    label: 'Carbón cálido',
    bgHex: '#1c1917',
    cardHex: '#292524',
    borderHex: '#44403c',
  },
  {
    id: 'deep-blue',
    label: 'Azul profundo',
    bgHex: '#0b1329',
    cardHex: '#132042',
    borderHex: '#1e293b',
  },
]

export function PreferencesPage() {
  const { data, isLoading, isError, error, refetch } = usePreferencesQuery()
  const updateMutation = useUpdatePreferencesMutation()
  const pushToast = useToastStore((state) => state.push)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  })
  const [darkPreset, setDarkPreset] = useState<DarkPreset>(() => {
    try {
      const saved = localStorage.getItem('glpi_dark_preset') as DarkPreset | null
      return saved && ['midnight', 'charcoal', 'deep-blue'].includes(saved) ? saved : 'midnight'
    } catch {
      return 'midnight'
    }
  })
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default')
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [isPushLoading, setIsPushLoading] = useState(false)
  const [isTestingPush, setIsTestingPush] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  // Comprobar estado de soporte y permisos de Web Push
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported')
      return
    }
    setPushStatus(Notification.permission)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setIsPushSubscribed(Boolean(sub))
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  const handleActivatePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      pushToast({
        title: 'Función no disponible',
        description: 'Tu navegador actual no admite notificaciones Web Push.',
        variant: 'destructive',
      })
      return
    }

    setIsPushLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission)

      if (permission !== 'granted') {
        pushToast({
          title: 'Permiso denegado',
          description: 'No se activaron las notificaciones. Puedes habilitarlas desde la configuración de tu navegador.',
          variant: 'warning',
        })
        setIsPushLoading(false)
        return
      }

      // Obtener clave pública VAPID desde el backend
      const { data: vapidData } = await apiClient.get<{ publicKey: string }>('/notifications/push/vapid-public-key')
      const reg = await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
        })
      }

      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      if (!p256dh || !auth) {
        throw new Error('No se pudieron obtener las claves de cifrado de la suscripción.')
      }

      const subscriptionDto = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
      }

      await apiClient.post('/notifications/push/subscribe', subscriptionDto)
      setIsPushSubscribed(true)
      pushToast({
        title: 'Notificaciones del dispositivo activadas',
        description: 'Recibirás alertas nativas en Windows o tu celular cuando haya cambios relevantes.',
        variant: 'success',
      })
    } catch (err) {
      pushToast({
        title: 'Error al activar notificaciones',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsPushLoading(false)
    }
  }

  const handleTestPush = async () => {
    setIsTestingPush(true)
    try {
      const { data } = await apiClient.post<{ success: boolean; sentToDevices: number }>('/notifications/push/test')
      pushToast({
        title: 'Prueba enviada',
        description: `Notificación enviada a ${data.sentToDevices} dispositivo(s). Comprueba tu barra de tareas o centro de notificaciones.`,
        variant: 'success',
      })
    } catch (err) {
      pushToast({
        title: 'Error al probar notificación',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setIsTestingPush(false)
    }
  }
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Limpiar timer de debounce al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Sincronizar preferencias iniciales con backend y localStorage
  useEffect(() => {
    if (data?.prefs) {
      try {
        const parsed = JSON.parse(data.prefs)
        const localTheme = localStorage.getItem('theme')
        const effectiveTheme =
          localTheme === 'dark' || localTheme === 'light'
            ? (localTheme as 'light' | 'dark')
            : parsed.theme === 'dark' || parsed.theme === 'light'
              ? (parsed.theme as 'light' | 'dark')
              : 'light'

        setTheme(effectiveTheme)
        localStorage.setItem('theme', effectiveTheme)
        if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.setAttribute('data-theme', 'dark')
          document.documentElement.setAttribute('data-dark-preset', darkPreset)
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.setAttribute('data-theme', 'light')
        }
      } catch {
        // En caso de JSON corrupto o vacío, mantener defaults
      }
    }
  }, [data?.prefs, darkPreset])

  const applyThemeDOM = (nextTheme: 'light' | 'dark', nextPreset: DarkPreset) => {
    localStorage.setItem('theme', nextTheme)
    localStorage.setItem('glpi_dark_preset', nextPreset)
    document.documentElement.setAttribute('data-dark-preset', nextPreset)
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }

  const triggerDebouncedSave = (
    nextTheme: 'light' | 'dark',
    nextPreset: DarkPreset,
    label: string,
  ) => {
    applyThemeDOM(nextTheme, nextPreset)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateMutation.mutate(
        { theme: nextTheme, density: 'comfortable' },
        {
          onSuccess: () => {
            setSavedMessage(true)
            pushToast({
              title: 'Tema actualizado',
              description: label,
              variant: 'success',
            })
            setTimeout(() => setSavedMessage(false), 3000)
          },
          onError: (err) => {
            pushToast({
              title: 'Error al sincronizar preferencias',
              description: getApiErrorMessage(err),
              variant: 'destructive',
            })
          },
        },
      )
    }, 300)
  }

  const autoSaveTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    triggerDebouncedSave(
      newTheme,
      darkPreset,
      `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado y guardado.`,
    )
  }

  const handlePresetSelect = (preset: DarkPreset) => {
    setDarkPreset(preset)
    triggerDebouncedSave(
      theme,
      preset,
      `Variante ${DARK_PRESET_OPTIONS.find((p) => p.id === preset)?.label ?? preset} aplicada.`,
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    triggerDebouncedSave(
      theme,
      darkPreset,
      'Tus preferencias visuales han sido actualizadas.',
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferencias"
        description="Configura tus preferencias visuales y de interfaz de usuario."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Preferencias' }]}
      />

      <Card className="max-w-2xl border-border/70 shadow-sm backdrop-blur-xl bg-card/80 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Opciones de visualización</CardTitle>
          <CardDescription>
            Personaliza el tema y la paleta nocturna de la aplicación con guardado automático instantáneo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-24" />
            </div>
          )}

          {isError && (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-destructive">
                Error al cargar preferencias: {error?.message || 'Error desconocido'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          )}

          {!isLoading && !isError && (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Selector semántico accesible / compatibilidad de formulario */}
              <select
                name="theme"
                id="theme"
                value={theme}
                onChange={(e) => autoSaveTheme(e.target.value as 'light' | 'dark')}
                className="sr-only"
                aria-label="Tema de la interfaz"
              >
                <option value="light">Claro</option>
                <option value="dark">Oscuro</option>
              </select>

              {/* Selector de Tema con Tarjetas Interactivas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Tema de la interfaz</Label>
                  <span className="text-xs text-muted-foreground font-medium">
                    {theme === 'dark' ? 'Modo Oscuro activo' : 'Modo Claro activo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Tarjeta Tema Claro */}
                  <button
                    type="button"
                    onClick={() => autoSaveTheme('light')}
                    className={cn(
                      'group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer backdrop-blur-md',
                      theme === 'light'
                        ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-md'
                        : 'border-border/60 hover:border-primary/40 bg-card/60 hover:bg-card/90',
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Sun className="size-4" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">Modo Claro</span>
                      </div>
                      {theme === 'light' && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 w-full pt-1">
                      <div className="h-3 w-8 rounded-full bg-[#f8fafc] border border-slate-300" />
                      <div className="h-3 w-12 rounded-full bg-[#ffffff] border border-slate-300" />
                      <div className="h-3 flex-1 rounded-full bg-slate-900/10" />
                    </div>
                  </button>

                  {/* Tarjeta Tema Oscuro */}
                  <button
                    type="button"
                    onClick={() => autoSaveTheme('dark')}
                    className={cn(
                      'group relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer backdrop-blur-md',
                      theme === 'dark'
                        ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-md'
                        : 'border-border/60 hover:border-primary/40 bg-card/60 hover:bg-card/90',
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          <Moon className="size-4" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">Modo Oscuro</span>
                      </div>
                      {theme === 'dark' && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 w-full pt-1">
                      <div className="h-3 w-8 rounded-full bg-[#0f172a] border border-slate-700" />
                      <div className="h-3 w-12 rounded-full bg-[#1e293b] border border-slate-700" />
                      <div className="h-3 flex-1 rounded-full bg-sky-400/30" />
                    </div>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Los cambios se guardan automáticamente al seleccionar un tema.
                </p>
              </div>

              {/* Variantes de modo oscuro (Presets) — Solo visibles si el tema es Oscuro (H-61) */}
              {theme === 'dark' && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <Label className="text-sm font-semibold">Variante de modo oscuro (Presets)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {DARK_PRESET_OPTIONS.map((opt) => {
                      const active = darkPreset === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          data-testid={`preset-option-${opt.id}`}
                          onClick={() => handlePresetSelect(opt.id)}
                          className={cn(
                            'relative flex flex-col items-start gap-2.5 rounded-2xl border p-3.5 text-left transition-all duration-200 cursor-pointer backdrop-blur-md',
                            active
                              ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-sm'
                              : 'border-border/60 hover:border-primary/40 bg-card/60 hover:bg-card/90',
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-4 rounded-full border shrink-0 shadow-xs"
                                style={{ backgroundColor: opt.bgHex, borderColor: opt.borderHex }}
                              />
                              <span
                                className="size-4 rounded-full border shrink-0 shadow-xs"
                                style={{ backgroundColor: opt.cardHex, borderColor: opt.borderHex }}
                              />
                            </div>
                            {active && (
                              <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                                <Check className="size-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{opt.bgHex}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elige entre Noche Slate (#0F172A), Carbón cálido (#1C1917) o Azul profundo (#0B1329).
                  </p>
                </div>
              )}

              {/* Feedback de autoguardado instantáneo con debounce (H-61) */}
              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <div className="flex items-center gap-2">
                  {updateMutation.isPending && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      Guardando automáticamente...
                    </span>
                  )}
                  {savedMessage && !updateMutation.isPending && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                      <Check className="size-3.5" /> Guardado correctamente
                    </span>
                  )}
                  {updateMutation.isError && (
                    <span className="text-xs font-medium text-destructive">
                      Error al sincronizar preferencias
                    </span>
                  )}
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Tarjeta de Notificaciones del Dispositivo (Web Push / Windows / Android) */}
      <Card className="max-w-2xl border-border/70 shadow-sm backdrop-blur-xl bg-card/80 rounded-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Bell className="size-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Notificaciones del dispositivo</CardTitle>
              <CardDescription>
                Alertas nativas del sistema operativo en Windows, Android o PWA instalada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/60 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Estado de alertas en este equipo:</span>
                {pushStatus === 'granted' && isPushSubscribed && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="size-3" /> Activas
                  </span>
                )}
                {pushStatus === 'denied' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-900 dark:text-rose-300 bg-rose-500/15 px-2 py-0.5 rounded-full">
                    <AlertCircle className="size-3" /> Bloqueadas
                  </span>
                )}
                {(pushStatus === 'default' || (pushStatus === 'granted' && !isPushSubscribed)) && (
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    No activadas
                  </span>
                )}
                {pushStatus === 'unsupported' && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    No compatible
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {pushStatus === 'granted' && isPushSubscribed
                  ? 'Recibirás notificaciones en el Centro de Actividades de Windows y en la barra de tu celular.'
                  : pushStatus === 'denied'
                    ? 'El navegador tiene bloqueado el permiso. Para activarlo, pulsa en el candado de la URL y permite Notificaciones.'
                    : pushStatus === 'unsupported'
                      ? 'Este navegador no soporta la API de notificaciones Web Push.'
                      : 'Activa las notificaciones para enterarte inmediatamente de asignaciones y tickets creados en GLPI.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {pushStatus !== 'granted' || !isPushSubscribed ? (
                <Button
                  type="button"
                  onClick={handleActivatePush}
                  disabled={isPushLoading || pushStatus === 'unsupported'}
                  className="rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                  data-testid="activate-device-notifications-btn"
                >
                  <Bell className="size-3.5 mr-1.5" />
                  {isPushLoading ? 'Activando...' : 'Activar notificaciones del dispositivo'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestPush}
                  disabled={isTestingPush}
                  className="rounded-xl text-xs font-semibold cursor-pointer border-primary/40 hover:bg-primary/10"
                  data-testid="test-device-notification-btn"
                >
                  <Send className="size-3.5 mr-1.5" />
                  {isTestingPush ? 'Enviando...' : 'Probar notificación OS'}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground pt-1">
            <div className="flex items-start gap-2 p-3 rounded-xl border border-border/40 bg-card/40">
              <Laptop className="size-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Windows 10/11</p>
                <p>Aparece como banner emergente y se almacena en el Centro de Notificaciones del sistema.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl border border-border/40 bg-card/40">
              <Smartphone className="size-4 shrink-0 mt-0.5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Android / PWA</p>
                <p>Se integra con el gestor nativo de notificaciones del celular incluso con la app cerrada.</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/80 border-t border-border/30 pt-3">
            🔒 <strong>Privacidad:</strong> Las alertas en pantalla bloqueada solo muestran el número de ticket y tipo de acción para resguardar la confidencialidad de los datos.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
