import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePreferencesQuery, useUpdatePreferencesMutation } from '@/hooks/usePreferences'

export function PreferencesPage() {
  const { data, isLoading, isError, error, refetch } = usePreferencesQuery()
  const updateMutation = useUpdatePreferencesMutation()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [savedMessage, setSavedMessage] = useState(false)

  // Cargar preferencias iniciales y aplicar data-theme
  useEffect(() => {
    if (data?.prefs) {
      try {
        const parsed = JSON.parse(data.prefs)
        if (parsed.theme === 'dark' || parsed.theme === 'light') {
          setTheme(parsed.theme)
          if (parsed.theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.setAttribute('data-theme', 'dark')
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.setAttribute('data-theme', 'light')
          }
        }
        if (parsed.density === 'compact' || parsed.density === 'comfortable') {
          setDensity(parsed.density)
        }
      } catch {
        // En caso de JSON corrupto o vacío, mantener defaults
      }
    }
  }, [data?.prefs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMessage(false)

    updateMutation.mutate(
      { theme, density },
      {
        onSuccess: () => {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark')
            document.documentElement.setAttribute('data-theme', 'dark')
          } else {
            document.documentElement.classList.remove('dark')
            document.documentElement.setAttribute('data-theme', 'light')
          }
          setSavedMessage(true)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preferencias</h1>
        <p className="text-sm text-muted-foreground">
          Configura tus preferencias visuales y de interfaz de usuario.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg">Opciones de visualización</CardTitle>
          <CardDescription>
            Personaliza el tema y la densidad de visualización para tu sesión.
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select
                  id="theme"
                  name="theme"
                  value={theme}
                  onChange={(e) => {
                    const val = e.target.value as 'light' | 'dark'
                    setTheme(val)
                    if (val === 'dark') {
                      document.documentElement.classList.add('dark')
                      document.documentElement.setAttribute('data-theme', 'dark')
                    } else {
                      document.documentElement.classList.remove('dark')
                      document.documentElement.setAttribute('data-theme', 'light')
                    }
                  }}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona la apariencia general de la aplicación.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="density">Densidad</Label>
                <Select
                  id="density"
                  name="density"
                  value={density}
                  onChange={(e) => setDensity(e.target.value as 'comfortable' | 'compact')}
                >
                  <option value="comfortable">Cómoda</option>
                  <option value="compact">Compacta</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Ajusta la cantidad de espaciado y compacidad de los elementos.
                </p>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </Button>
                {savedMessage && (
                  <span className="text-sm font-medium text-emerald-600">
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
