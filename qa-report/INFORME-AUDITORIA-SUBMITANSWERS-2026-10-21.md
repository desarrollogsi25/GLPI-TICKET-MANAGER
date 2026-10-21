# Auditoría funcional GLPI — SubmitAnswers

**Fecha:** 2026-10-21 (Europe/Paris)  
**Entorno:** Docker local, GLPI `11.0.11`, API `localhost:8080`, GLPI `localhost:8081`  
**Resultado general:** error 500 corregido; los flujos principales de creación, reclamación y permisos de reapertura se verificaron. La auditoría completa de UI y tiempo real queda parcial; ver controles pendientes.

## Causa raíz y solución

Los destinos de ticket de los formularios **Requerimiento BI (formulario 5)** y **Hardware (formulario 8)** tenían mal escapado el atributo `data-form-tag-provider`: el HTML generado contenía `Glpi\\Form\\Tag\\AnswerTagProvider` (dos barras por separador), en lugar del nombre de clase PHP `Glpi\Form\Tag\AnswerTagProvider`.

Al procesar la etiqueta de respuesta durante `SubmitAnswers`, Composer resolvía el nombre mal formado al mismo archivo y PHP intentaba declarar `AnswerTagProvider` de nuevo. El log de Apache/PHP mostraba `Cannot redeclare class Glpi\Form\Tag\AnswerTagProvider`, con el rastro desde `FormTagsManager::insertTagsContent()` → `ContentField` → `AnswersHandler`.

Se reparó el escape en `glpi_forms_destinations_formdestinations.config` para los destinos ID **4** (formulario 5) y **7** (formulario 8), reduciendo de cuatro a dos barras las secuencias JSON que representan el separador del namespace. Ambos JSON siguen siendo válidos. Se limpió la caché GLPI y se reinició el contenedor `glpi` para limpiar PHP/OPcache. No hizo falta desactivar plugins ni modificar el código fuente de GLPI.

**Persistencia:** el cambio se hizo directamente en la base MariaDB del volumen Docker. No está guardado en un archivo de migración del repositorio; al reemplazar/restaurar el volumen de datos hay que conservar esta corrección.

## Diagnóstico solicitado

| Comprobación | Resultado |
| --- | --- |
| `docker exec glpi tail .../files/_log/php-errors.log` | El archivo no existe en la ruta indicada ni bajo `/var/glpi`; el detalle real estaba en `docker logs glpi`. |
| Versión | `GLPI CLI 11.0.11` (`php bin/console --version`). El `require inc/includes.php` sugerido no define `GLPI_VERSION` en CLI y lanza constante indefinida. |
| Integridad DB | PASS — `El esquema de base de datos es correcto.` |
| Caché y logs | PASS — `_cache` y `_log` existen, pertenecen a `www-data:www-data` y son `drwxrwxr-x`; no se encontró `php-errors.log`. |
| Plugins | No se encontró ningún plugin instalado en `plugins/`; Behaviors/Formcreator no participaron en el fallo. |
| Sintaxis del core | El archivo `AnswerTagProvider.php` contiene una única declaración de clase; el fatal lo disparaba el valor escapado del destino del formulario. |

## Flujos funcionales y evidencia

| Flujo / control | Resultado | Evidencia |
| --- | --- | --- |
| Solicitante crea ticket nativo Hardware | **PASS** | El formulario mostró “Formulario enviado” y “Elemento creado con éxito: Prueba auditoría funcional 21-10-2026”; ticket **#903**, categoría Hardware (ID 11). `POST /Form/SubmitAnswers` devolvió **200**. |
| Ticket en la cola Hardware del técnico | **PASS** | `GET /api/tickets/by-group?groupId=7&unassigned=true` como `tecnico_test1` devolvió el ticket #903 sin asignar. |
| Técnico reclama y mueve a En Progreso | **PASS** | `POST /api/tickets/903/claim` completó; `PATCH /api/tickets/903/status` con `status=3` devolvió **204**. |
| Técnico registra solución y resuelve | **PASS** | La solución quedó registrada (**201**) y `PATCH .../status` con `status=5` devolvió **204**. El servicio lo cerró automáticamente según la política existente. |
| Administrador reabre ticket cerrado | **PASS** | Sobre el ticket de prueba #903, `POST /api/tickets/903/reopen` como `admin_test` devolvió **200**. Después se volvió a cerrar para probar el control técnico. |
| Técnico intenta reabrir ticket cerrado | **PASS** | El mismo endpoint como `tecnico_test1` devolvió **403**. |
| Rol solicitante | **PASS parcial** | Login API devolvió rol `solicitante` (perfil GLPI 1). Las rutas `/kanban` y `/queue` están protegidas en `frontend/src/App.tsx` para técnico/supervisor/admin y el guard redirige a `/tickets`. La consulta API de cola para el solicitante sin grupos devuelve lista vacía (200), no tarjetas. No se hizo navegación visual con sesión del solicitante. |
| Toast y cierre de modal al resolver | **NO VERIFICADO visualmente** | El endpoint resolvió; no se recorrió el modal del Service Desk durante este ciclo. |
| SignalR entre dos pestañas | **NO VERIFICADO** | No se abrió un par de sesiones conectadas para observar actualización en vivo. |
| Rango de fechas invertido, estado/prioridad | **NO VERIFICADO en UI** | No se comprobó mensaje español ni ausencia de petición de red; tampoco se ejercitaron los selectores visuales. |
| `Solicitudes en curso` del solicitante | **PASS parcial** | Tras el envío, GLPI mostró el ticket #903 y el enlace “Ver mis tickets”; no se comprobó la lista tras navegar a esa vista. |

### Extracto de logs

Antes de la corrección:

```text
PHP Fatal error: Cannot redeclare class Glpi\Form\Tag\AnswerTagProvider
... FormTagsManager.php(114): is_a()
... ContentField.php(126)
... SubmitAnswerController.php(159)
POST /Form/SubmitAnswers HTTP/1.1 500
```

Después de corregir los destinos y reiniciar GLPI:

```text
POST /Form/SubmitAnswers HTTP/1.1 200
Elemento creado con éxito: Prueba auditoría funcional 21-10-2026
```

La única traza fatal que aparece en los logs posteriores es el intento previo a la corrección (17:21:22). El nuevo envío exitoso es de 17:22:33.

## Hallazgos y límites

- El comando de versión del prompt no es válido para esta imagen/arranque CLI; usar `php bin/console --version`.
- Los logs de PHP están expuestos en `docker logs glpi`; no hay archivo `_log/php-errors.log` en este despliegue.
- La corrección de los destinos de formulario es un cambio operativo en la base de datos, no versionado en el repositorio.
- El ticket de prueba #903 quedó cerrado después de verificar la restricción de reapertura del técnico.
- No hay evidencias de fallo actual en la cola Hardware: el ticket se mostró a `tecnico_test1`. Otros grupos o usuarios no se auditaron exhaustivamente.
- Quedan pendientes las pruebas visuales de SignalR, filtros y feedback de UI descritas arriba.

## Veredicto

**Apto para una demo centrada en el envío del formulario Hardware y ciclo ticket técnico/admin.** El 500 bloqueante está corregido en el entorno activo y el flujo se comprobó con un ticket real de prueba. **No declarar la auditoría funcional completa como PASS** antes de verificar SignalR, filtros de UI y el toast/modal en una sesión interactiva.
