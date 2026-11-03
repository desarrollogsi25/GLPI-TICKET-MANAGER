# Borrador de webhook TicketCreated en GLPI 11

La migración opcional `db/glpi/007_glpi_webhook_config.sql` se ejecuta con el cliente MariaDB en modo batch, en una conexión nueva sin `--force`. Seleccione la base GLPI de destino con `--database`. En esa misma sesión configure dos variables antes de cargar el script. Sustituya los ejemplos por el nombre esperado de la base y la URL aprobada para el entorno. Use HTTPS fuera de una red de laboratorio aislada.

```sql
SET @glpi_expected_database = 'example_glpi';
SET @glpi_webhook_url = 'https://tickets.example.invalid/api/integrations/glpi/ticket-created';
SOURCE db/glpi/007_glpi_webhook_config.sql;
```

El SQL verifica el nombre seleccionado y la versión de GLPI. La categoría raíz se identifica por padre y nombre. En GLPI 11.0.11 solo el ID del webhook es único: un upsert por nombre creaba otro borrador. Un ID fijo de categoría y un INSERT IGNORE podían ocultar una colisión. El nuevo script usa el ID asignado por MariaDB y reconoce sus filas por una marca de propiedad. Una coincidencia ambigua o una configuración distinta hace fallar la operación. No reasigna filas ajenas. Un segundo pase sobre el borrador intacto conserva incluso las fechas.

Las inserciones se agrupan en una transacción con rollback ante errores o advertencias. El bloqueo nominal por base solo coordina a escritores que respetan ese mismo bloqueo. Evite ediciones concurrentes desde la interfaz durante la migración. Revise manualmente cualquier borrador creado por versiones anteriores o configurado después de ejecutar 007.

## Verificación previa a la activación

Confirme en GLPI el evento `Ticket / new`, la URL, el método POST y el estado inactivo. En **Preview**, seleccione un ticket sintético y compare el ID de los datos de la API con el entero de `{"ticketId": {{ item.id }}}` ya renderizado. El editor nativo usa Twig. La prueba de regresión compara el texto almacenado; la entrega HTTP y el comportamiento de reintentos requieren pruebas de integración independientes.

Configure el secreto mediante el campo de seguridad de GLPI para que GLPI lo cifre con su propia clave. El borrador deja el secreto nulo y la colección de cabeceras personalizadas vacía. Configure por separado el mismo secreto en el backend mediante su gestor de secretos. La autenticación requiere las cabeceras de firma y tiempo que genera GLPI. La activación y el envío de prueba son operaciones posteriores.

La prueba `scripts/test-glpi-007.sh` crea una base nueva en MariaDB de pruebas a partir de un dump confiable de GLPI 11 sin instrucciones USE o CREATE DATABASE. Comprueba conflictos, rollback, ausencia de cambios ajenos y equivalencia tras dos ejecuciones. Ejecútela únicamente en una instancia descartable.
