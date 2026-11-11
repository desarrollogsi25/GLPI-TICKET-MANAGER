import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRole } from '@/hooks/useRole'

const STATUS_STEPS = [
  ['1. Nuevo', 'Ticket recién creado, todavía sin responsable.'],
  ['2. Asignado', 'Tiene técnico o grupo asignado y aún no tiene una tarea planificada.'],
  ['3. En proceso (planificado)', 'Tiene una programación activa (TicketTask) con fecha y técnico.'],
  ['4. Pendiente (En espera)', 'En espera de respuesta del usuario o de un tercero.'],
  ['5. Resuelto', 'Tiene solución registrada; el cierre definitivo lo gestiona la acción closeticket de GLPI.'],
  ['6. Cerrado', 'Estado final definitivo de GLPI; accesible para consulta en modo solo lectura.'],
] as const

export function AgentGuide() {
  const { isRequester } = useRole()

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={isRequester ? 'Ayuda' : 'Guía del agente'}
        description={
          isRequester
            ? 'Cómo consultar y seguir los tickets que abriste en GLPI.'
            : 'Cómo trabajar los tickets del call center sin salir del flujo de GLPI.'
        }
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Ayuda' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Los tickets se crean en GLPI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Ticket Manager no crea tickets. Los tickets nacen en el formulario nativo de GLPI
            (o por las vías configuradas en GLPI) y este panel los muestra para gestionarlos.
          </p>
          <p className="text-muted-foreground">
            {isRequester
              ? 'Para abrir un ticket usá el formulario de GLPI. Cuando esté creado, aparecerá en “Mis tickets”.'
              : 'Si un usuario necesita un ticket nuevo, cargalo en GLPI y luego gestioná el ciclo de vida desde el Kanban.'}
          </p>
        </CardContent>
      </Card>

      {isRequester ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>1. Consultar tus tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Entrá a “Mis tickets”.</li>
                <li>Cada fila muestra el estado actual, la prioridad y la última actualización.</li>
                <li>Abrí el ticket para leer la descripción, el seguimiento y la solución.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Seguimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Los cambios de estado se actualizan en tiempo real.</li>
                <li>Si el ticket queda “Pendiente”, el equipo espera tu respuesta en GLPI.</li>
                <li>Cuando esté “Resuelto”, podés consultar la solución en el detalle.</li>
              </ol>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>1. Ver tu cola</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Entrá al menú “Cola del grupo”.</li>
                <li>Cada tarjeta muestra un ticket sin técnico asignado (estado Nuevo o Asignado al grupo sin técnico) con su prioridad y urgencia.</li>
                <li>Usá el selector de grupo si tu perfil tiene varios grupos.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Asignarte un ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>En la cola, hacé clic en “Asignarme”.</li>
                <li>El ticket pasa a estar asignado a tu usuario y se traslada a tu columna personal.</li>
                <li>Si no aparece en la cola, verificá que pertenezca a tu grupo y que no tenga ya un técnico asignado (los tickets entran a la cola en estado Nuevo o Asignado a grupo sin técnico).</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Planificar</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Abrí un ticket asignado y pulsá “Planificar”.</li>
                <li>Indicá fecha, duración, técnico y comentario.</li>
                <li>Se crea una tarea real de GLPI y el ticket pasa a “En proceso”.</li>
                <li>Al completar la tarea, GLPI devuelve el ticket a “Asignado”.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Resolver un ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Abrí el ticket asignado.</li>
                <li>Después de atenderlo, pulsá “Resolver”.</li>
                <li>Ingresá la solución obligatoria en el modal.</li>
                <li>El ticket pasa a estado “Resuelto”. El cierre definitivo a estado “Cerrado” es gestionado automáticamente por GLPI (acción closeticket) o por el supervisor.</li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Estados de GLPI</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {STATUS_STEPS.map(([status, description]) => (
              <div key={status}>
                <dt className="font-medium text-foreground">{status}</dt>
                <dd className="text-muted-foreground">{description}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>¿Problema?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Consultá al responsable de tu grupo o reportá un incidente en el sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
