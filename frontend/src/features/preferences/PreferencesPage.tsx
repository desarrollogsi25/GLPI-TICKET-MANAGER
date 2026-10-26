import { useEffect, useState } from 'react'

import { PageHeader } from '@/components/layout/PageHeader'
import type { DarkPreset } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
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
    bgHex: '#020617',
    cardHex: '#0f172a',
    borderHex: '#334155',
  },
  {
    id: 'charcoal',
    label: 'Carbón cálido',
    bgHex: '#0c0a09',
    cardHex: '#1c1917',
    borderHex: '#44403c',
  },
  {
    id: 'deep-blue',
    label: 'Azul profundo',
    bgHex: '#030712',
    cardHex: '#0a1128',
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
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [themeTouched, setThemeTouched] = useState(false)
  const [densityTouched, setDensityTouched] = useState(false)
  const [savedMessage, setSavedMessage] = useState(false)

  const themeError = themeTouched && !['light', 'dark'].includes(theme)
    ? 'El tema seleccionado no es válido.'
    : null
  const densityError = densityTouched && !['comfortable', 'compact'].includes(density)
    ? 'La densidad seleccionada no es válida.'
    : null
  const hasErrors = Boolean(themeError || densityError)

  // Cargar preferencias iniciales sincronizadas con backend (priorizando localStorage)
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

        if (parsed.density === 'compact' || parsed.density === 'comfortable') {
          setDensity(parsed.density)
        }
      } catch {
        // En caso de JSON corrupto o vacío, mantener defaults
      }
    }
  }, [data?.prefs, darkPreset])

  const handlePresetSelect = (preset: DarkPreset) => {
    setDarkPreset(preset)
    document.documentElement.setAttribute('data-dark-preset', preset)
    try {
      localStorage.setItem('glpi_dark_preset', preset)
    } catch {
      // ignore
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMessage(false)

    if (hasErrors) return

    updateMutation.mutate(
      { theme, density },
      {
        onSuccess: () => {
          localStorage.setItem('theme', theme)
          localStorage.setItem('glpi_dark_preset', darkPreset)
          document.documentElement.setAttribute('data-dark-preset', darkPreset)
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.setAttribute('data-theme', 'dark')
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.setAttribute('data-theme', 'light')
          }
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

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Opciones de visualización</CardTitle>
          <CardDescription>
            Personaliza el tema, la paleta nocturna y la densidad de visualización para tu sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-4 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
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
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  id="theme"
                  name="theme"
                  value={theme}
                  aria-invalid={Boolean(themeError)}
                  aria-describedby={themeError ? 'theme-error' : undefined}
                  className={themeError ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  onBlur={() => setThemeTouched(true)}
                  onChange={(e) => {
                    const val = e.target.value as 'light' | 'dark'
                    setTheme(val)
                    localStorage.setItem('theme', val)
                    if (val === 'dark') {
                      document.documentElement.classList.add('dark')
                      document.documentElement.setAttribute('data-theme', 'dark')
                      document.documentElement.setAttribute('data-dark-preset', darkPreset)
                    } else {
                      document.documentElement.classList.remove('dark')
                      document.documentElement.setAttribute('data-theme', 'light')
                    }
                  }}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </Select>
                {themeError ? (
                  <p id="theme-error" role="alert" className="text-xs text-destructive">
                    {themeError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Selecciona la apariencia general de la aplicación.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Variante de modo oscuro (Presets)</Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {DARK_PRESET_OPTIONS.map((opt) => {
                    const active = darkPreset === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`preset-option-${opt.id}`}
                        onClick={() => handlePresetSelect(opt.id)}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer',
                          active
                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                            : 'border-border hover:border-primary/40 bg-card',
                        )}
                      >
                        <div className="flex items-center gap-1.5 w-full">
                          <span
                            className="h-4 w-4 rounded-full border shrink-0"
                            style={{ backgroundColor: opt.bgHex, borderColor: opt.borderHex }}
                          />
                          <span
                            className="h-4 w-4 rounded-full border shrink-0"
                            style={{ backgroundColor: opt.cardHex, borderColor: opt.borderHex }}
                          />
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
                  Elige entre Noche (Slate #020617), Carbón cálido (#0c0a09) o Azul profundo (#030712).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="density">Densidad</Label>
                <Select
                  id="density"
                  name="density"
                  value={density}
                  aria-invalid={Boolean(densityError)}
                  aria-describedby={densityError ? 'density-error' : undefined}
                  className={densityError ? 'border-destructive focus-visible:ring-destructive' : undefined}
                  onBlur={() => setDensityTouched(true)}
                  onChange={(e) => setDensity(e.target.value as 'comfortable' | 'compact')}
                >
                  <option value="comfortable">Cómoda</option>
                  <option value="compact">Compacta</option>
                </Select>
                {densityError ? (
                  <p id="density-error" role="alert" className="text-xs text-destructive">
                    {densityError}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ajusta la cantidad de espaciado y compacidad de los elementos.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" disabled={hasErrors || updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                {savedMessage && (
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Guardado correctamente
                  </span>
                )}
                {updateMutation.isError && (
                  <span className="text-sm font-medium text-destructive">
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
