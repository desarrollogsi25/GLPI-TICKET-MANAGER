# Guía rápida — GLPI Ticket Manager

> **Control documental ISO 9001**
> **Código:** DOC-USR-GUI-001 | **Versión:** 1.1.0 | **Fecha:** 2026-10-28
> **Autor:** Codex | **Revisión:** Codex (consistencia con la interfaz H-64 verificada) | **Alcance:** interfaz H-64

Las opciones disponibles dependen de su rol y del estado del ticket. El formato de control documental no constituye una certificación ISO.

## Acceder y orientarse

Abra la dirección facilitada por su organización e introduzca sus credenciales. El acceso presenta el logo GSI y el formulario sobre olas sutiles.

Use el menú para Mis tickets, Cola del grupo, Tickets y vistas autorizadas. El breadcrumb superior indica su ubicación; la página muestra el título principal. En móvil dispone del menú y accesos inferiores. El botón Sol/Luna alterna claro y oscuro.

La búsqueda superior abre la paleta de comandos; también puede usar `Ctrl+K` o `Cmd+K`. Escriba la sección y seleccione una opción. `Escape` la cierra.

## Tomar y consultar tickets

1. Abra **Cola del grupo** para consultar casos disponibles de su equipo.
2. Pulse **Asignarme** cuando la acción esté disponible.
3. Continúe en **Mis tickets**. Las acciones de la tarjeta reflejan las transiciones permitidas.
4. Abra el detalle para descripción, responsable y seguimientos. Use **Tickets** y sus filtros para localizar un caso.

Registre incidencias nuevas mediante el portal o formulario habilitado por su organización, con título claro y descripción suficiente. Evite contraseñas o secretos en comentarios.

## Pendiente, resolución y reapertura

| Acción | Pasos y campos | Resultado |
| --- | --- | --- |
| **Poner en pendiente** | Abra detalle, pulse la acción, elija motivo y escriba comentario; pulse **Confirmar**. | Pasa a Pendiente y registra comentario según el flujo existente. |
| **Resolver** | Pulse la acción, escriba solución no vacía y confirme con **Resolver**. Puede ser breve si describe correctamente el resultado. | Pasa a Resuelto tras confirmación del servidor. |
| **Reabrir** | Con cuenta autorizada y ticket elegible, pulse **Reabrir**. Motivo opcional, máximo 500 caracteres. | Vuelve a Asignado; si indica motivo se añade conforme al flujo existente. |

Los errores de validación aparecen después de intentar confirmar, no al entrar o salir de un campo. Corrija la información y confirme otra vez. Reapertura no exige motivo. Mientras se guarda, espere respuesta y aviso de resultado; si falla, revise el mensaje antes de reintentar.

**Cancelar** cierra sin confirmar. Puede usar `Escape` cuando la operación lo permita; durante resolución en curso el diálogo permanece abierto hasta recibir respuesta.

## Supervisar Mi Equipo

Con permisos adecuados, abra **Mi Equipo** y elija grupo. Revise indicadores y carga por técnico. En **Tablero de Tickets del Grupo**, combine técnico, estado y fechas desde la barra de filtros.

Pulse la fecha para abrir calendario, cambie mes y elija día. El rango respeta inicio y fin. Puede operarlo con teclado y cerrarlo con `Escape` o clic externo. **Limpiar filtros** restablece la vista del grupo.

En escritorio verá una tabla; en móvil, tarjetas a ancho completo con ID, título, estado, técnico y acceso al detalle. Ambas muestran los mismos resultados filtrados.

## Notificaciones, preferencias y ayuda

Abra la campana para consultar avisos. Los no leídos se distinguen visualmente; use las acciones para marcarlos como leídos. El contador refleja pendientes. Para avisos del navegador, use la activación disponible y responda a su petición de permisos.

En **Preferencias**, modifique los ajustes disponibles y guarde cuando corresponda. Use **Cerrar sesión** para terminar. Consulte **Guía del agente** para ayuda adicional.

Al reportar un problema incluya pantalla, pasos, resultado esperado y captura sin credenciales ni datos sensibles. El [manual QA H-64](qa/manual-pruebas.md) recoge criterios y escenarios; los resultados se registran tras ejecutar las pruebas.
