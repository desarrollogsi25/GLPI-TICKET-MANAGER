import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AgentGuide() {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Guía del agente"
        description="Cómo trabajar los tickets del call center."
        breadcrumbs={[{ label: 'Inicio', href: '/' }, { label: 'Ayuda' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>1. Ver tu cola</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Entrá al menú “Cola del grupo”.</li>
            <li>Cada tarjeta muestra un ticket sin asignar con su prioridad y Urgencia.</li>
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
            <li>El ticket pasa a ser tuyo y desaparece de la cola.</li>
            <li>Si no aparece, verificá que sea del grupo correcto y estado Nuevo.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Crear un ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Desde “Tickets” o cualquier pantalla, abrí “Nuevo ticket”.</li>
            <li>Elegí el tipo de solicitante (interno o externo).</li>
            <li>Si es externo, completá nombre, teléfono y empresa.</li>
            <li>Elegí el canal correspondiente y definí la descripción.</li>
            <li>Usá “Asignarme este ticket” si te ocupás del ticket; si no, quedará para el grupo.</li>
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
            <li>El ticket pasa a estado “Resuelto”.</li>
          </ol>
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
