import { useEffect, useState } from 'react'
import { Check, Moon, Sun } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import type { DarkPreset } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { usePreferencesQuery, useUpdatePreferencesMutation } from '@/hooks/usePreferences'
import { getApiErrorMessage } from '@/lib/api/errors'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/store/toastStore'

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
  const [savedMessage, setSavedMessage] = useState(false)

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

  const autoSaveTheme = (newTheme: 'light' | 'dark', preset = darkPreset) => {
    setTheme(newTheme)
    applyThemeDOM(newTheme, preset)
    updateMutation.mutate(
      { theme: newTheme, density: 'comfortable' },
      {
        onSuccess: () => {
          setSavedMessage(true)
          pushToast({
            title: 'Tema actualizado',
            description: `Modo ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado y guardado.`,
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
  }

  const handlePresetSelect = (preset: DarkPreset) => {
    setDarkPreset(preset)
    applyThemeDOM(theme, preset)
    updateMutation.mutate(
      { theme, density: 'comfortable' },
      {
        onSuccess: () => {
          setSavedMessage(true)
          pushToast({
            title: 'Paleta nocturna actualizada',
            description: `Variante ${DARK_PRESET_OPTIONS.find((p) => p.id === preset)?.label ?? preset} aplicada.`,
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
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMessage(false)

    updateMutation.mutate(
      { theme, density: 'comfortable' },
      {
        onSuccess: () => {
          applyThemeDOM(theme, darkPreset)
          setSavedMessage(true)
          pushToast({
            title: 'Preferencias guardadas correctamente',
            description: 'Tus preferencias visuales han sido actualizadas.',
            variant: 'success',
          })
        },
        onError: (err) => {
          pushToast({
            title: 'Error al guardar preferencias',
            description: getApiErrorMessage(err),
            variant: 'destructive',
          })
        },
      },
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
              {/* Selector de Tema con Dropdown y Tarjetas Liquid Glass */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="theme" className="text-sm font-semibold">Tema de la interfaz</Label>
                  <select
                    id="theme"
                    name="theme"
                    aria-label="Seleccionar tema"
                    value={theme}
                    onChange={(e) => autoSaveTheme(e.target.value as 'light' | 'dark')}
                    className="w-36 text-xs h-8 px-2.5 rounded-xl border border-border/80 bg-background/80 text-foreground shadow-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 transition-colors"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                  </select>
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

              {/* Variantes de modo oscuro (Presets) */}
              <div className="space-y-3 pt-2">
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

              {/* Botón Guardar discreto y feedback de guardado */}
              <div className="flex items-center gap-4 pt-3 border-t border-border/40">
                <Button
                  type="submit"
                  size="sm"
                  variant="outline"
                  disabled={updateMutation.isPending}
                  className="rounded-xl"
                >
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar preferencias'}
                </Button>
                {savedMessage && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <Check className="size-3.5" /> Guardado correctamente
                  </span>
                )}
                {updateMutation.isError && (
                  <span className="text-xs font-medium text-destructive">
                    Error al guardar preferencias
                  </span>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
