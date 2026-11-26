import { BookOpen, HelpCircle, Info, Keyboard, Workflow } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { useRole } from '@/hooks/useRole'

const STATUS_STEPS = [
  { code: 1, title: '1. Nuevo', description: 'Ticket recién creado, todavía sin responsable.' },
  { code: 2, title: '2. Asignado', description: 'Tiene técnico o grupo asignado y aún no tiene una tarea planificada.' },
  { code: 3, title: '3. En proceso (planificado)', description: 'Tiene una programación activa (TicketTask) con fecha y técnico.' },
  { code: 4, title: '4. Pendiente (En espera)', description: 'En espera de respuesta del usuario o de un tercero.' },
  { code: 5, title: '5. Resuelto', description: 'Tiene solución registrada; el cierre definitivo lo gestiona la acción closeticket de GLPI.' },
  { code: 6, title: '6. Cerrado', description: 'Estado final definitivo de GLPI; accesible para consulta en modo solo lectura.' },
] as const

export function AgentGuide() {
  const { isRequester } = useRole()

  return (
    <div className="max-w-4xl space-y-5 pb-8">
      <PageHeader
        title={isRequester ? 'Ayuda' : 'Guía del agente'}
        description={
          isRequester
            ? 'Cómo consultar y seguir los tickets que abriste en GLPI.'
            : 'Referencia rápida del flujo operativo conectado a GLPI 11.'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Ayuda' }]}
      />

      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/70">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Info className="size-4 text-primary" aria-hidden="true" />
            <span>Los tickets se crean en GLPI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2 text-sm leading-relaxed">
          <p className="text-foreground">
            Ticket Manager no crea tickets. Los tickets nacen en el formulario nativo de GLPI (o por las
            vías configuradas en GLPI) y este panel los presenta en tiempo real para gestionarlos.
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isRequester
              ? 'Para abrir un ticket usa el formulario del portal GLPI. Cuando esté creado, aparecerá automáticamente en “Mis tickets”.'
              : 'Si un usuario necesita un ticket nuevo, cárgalo en GLPI y luego gestiona el ciclo de vida desde el Kanban o la Cola del grupo.'}
          </p>
        </CardContent>
      </Card>

      {isRequester ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">1. Consultar tus tickets</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Entra a “Mis tickets” en el menú principal.</li>
                <li>Cada fila muestra el estado actual, la prioridad y la última actualización.</li>
                <li>Abre el ticket para leer la descripción, el seguimiento y la solución aplicada.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">2. Seguimiento</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Los cambios de estado se actualizan en tiempo real sin recargar la página.</li>
                <li>Si el ticket queda “Pendiente”, el equipo espera tu respuesta en GLPI.</li>
                <li>Cuando esté “Resuelto”, puedes consultar la solución directamente en el detalle.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">1. Ver tu cola</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Entra al menú “Cola” o columna “Cola del grupo” en Kanban.</li>
                <li>Cada tarjeta muestra tickets sin técnico asignado con prioridad y urgencia.</li>
                <li>Usa el selector de grupo o búsqueda si tu perfil supervisa varios equipos.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">2. Asignarte un ticket</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>En la cola o en el detalle, haz clic en “Asignarme”.</li>
                <li>El ticket pasa a tu responsabilidad y aparece en tu columna personal.</li>
                <li>Si no aparece, verifica que pertenezca a tu grupo y no tenga ya un técnico.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">3. Planificar</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Abre un ticket asignado y pulsa “Planificar tarea”.</li>
                <li>Indica fecha, horario y descripción de la intervención.</li>
                <li>Se crea una tarea real (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">TicketTask</code>) en GLPI y el ticket pasa a “En proceso”.</li>
                <li>Al completar la tarea, GLPI actualiza el historial automáticamente.</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/70">
              <CardTitle className="text-sm font-semibold">4. Resolver un ticket</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Completa cualquier tarea técnica pendiente asociada al ticket.</li>
                <li>Pulsa “Resolver” e ingresa la solución obligatoria en el modal.</li>
                <li>El ticket pasa a “Resuelto”. El cierre definitivo lo gestiona GLPI (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">closeticket</code>) o un administrador.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border/70">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Workflow className="size-4 text-primary" aria-hidden="true" />
            <span>Estados de GLPI</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="divide-y divide-border/60 text-sm">
            {STATUS_STEPS.map((step) => (
              <div
                key={step.code}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
              >
                <dt className="flex items-center gap-2.5 shrink-0 font-medium text-foreground text-xs">
                  <StatusBadge status={step.code} size="sm" />
                  <span>{step.title}</span>
                </dt>
                <dd className="text-xs text-muted-foreground sm:text-right">{step.description}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Keyboard className="size-4 text-muted-foreground" aria-hidden="true" />
              <span>Atajos rápidos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Abrir buscador global / saltar a #ID</span>
              <kbd className="rounded border border-border bg-surface-subtle px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Cerrar modal o panel activo</span>
              <kbd className="rounded border border-border bg-surface-subtle px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                Esc
              </kbd>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="pb-3 border-b border-border/70">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {isRequester ? (
                <HelpCircle className="size-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
              <span>¿Necesitas ayuda adicional?</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Consulta al supervisor de tu grupo o registra un incidente en el portal corporativo de GLPI.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
