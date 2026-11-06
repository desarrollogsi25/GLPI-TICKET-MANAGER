# Verificación del estado visible y cierre automático — 2026-11-06

## Alcance y evidencia

- GLPI 11 nativo, `Soporte → Solicitudes` (`/front/ticket.php`), **presenta la columna “Estado” también en Self-Service**. Verificado el 2026-11-06 con un solicitante de demostración: la tabla muestra “En espera”, “En curso (asignado)” y “En curso (planificada)”. La lista estándar de GLPI mostró 6 tickets activos; Ticket Manager mostró 12, incluidos cerrados. Son filtros diferentes.
- Ticket Manager, `/tickets` (“Mis tickets” para solicitante), ya presenta el estado de GLPI por nombre en tabla y tarjetas. El Kanban conserva ahora tanto el estado 5 como el 6 en su última columna; cada tarjeta indica el estado real, evitando que el cierre nativo haga desaparecer el ticket del tablero.
- La API `POST /api/tickets/{id}/resolve` **guarda una solución en GLPI y confirma el estado real**. No debe enviar a la interfaz un estado 6 supuesto antes de que GLPI lo confirme.

## Cierre automático para TODOS los orígenes — configuración LAN verificada

Usar la **configuración oficial de GLPI**, no un `UPDATE` directo a `glpi_tickets` ni un segundo cierre no transaccional en el API de Ticket Manager. Esta configuración alcanza tickets resueltos desde GLPI y desde Ticket Manager.

1. En sesión administrativa autorizada se abrió **Administración → Entidades → Entidad raíz → Soporte** y se cambió el cierre de **Nunca** a **Inmediatamente**. Se guardó, recargó y verificó la persistencia. La purga continúa en **Nunca**.
2. En **Configuración → Acciones automáticas → `closeticket` (ID 15)** se cambió la frecuencia de 12 horas a **5 minutos**. Se guardó y verificó. Modo de ejecución **GLPI** (por visitas); el panel mostraba aviso de que las acciones automáticas podían no ejecutarse como se esperaba.
3. Con autorización expresa del usuario se pulsó **Ejecutar** una vez. El log a las **13:37 del 2026-11-06** informó **“Action completed, fully processed”**, **1** ticket procesado. El ticket sintético **#1033** cambió de **Resuelto (5)** a **Cerrado (6)** con fecha de cierre e histórico; Ticket Manager, como solicitante, reflejó `Cerrado`.
4. **Bloqueo operativo confirmado:** en una visita posterior, otras acciones automáticas tenían ejecuciones hasta las **13:54**, pero `closeticket` seguía en **última ejecución 13:37** y **“Próxima ejecución: Lo antes posible (2026-11-06 13:42)”**. Por tanto, la frecuencia configurada de 5 minutos **no se estaba cumpliendo en ese momento**. Es necesario revisar el programador real y, si el modo GLPI por visitas es insuficiente, configurar y verificar un disparador CLI continuo desde el host Docker/Windows, sin duplicar ejecuciones.

**Decisión de negocio importante:** el cierre inmediato impide al solicitante aceptar/rechazar una solución antes del cierre. GLPI admite esperar un plazo (p. ej. 1 día) si el jefe prefiere revisión. Esta decisión se debe comunicar en la demostración.

**Comprobado en LAN:** cambio de configuración y un cierre real desde GLPI. **No se eliminaron tickets, volúmenes ni bases de datos.**

### Desbloqueo de la ejecución desatendida (host Windows con Docker Desktop)

La documentación oficial de GLPI recomienda **modo CLI**, con un disparador externo del archivo `front/cron.php` **cada minuto**, no solo el modo GLPI por visitas: <https://help.glpi-project.org/documentation/modules/configuration/crontasks>.

1. Confirmar desde el host correcto (en modo lectura) la ruta y el usuario PHP del contenedor: `docker exec glpi sh -lc 'test -f /var/www/glpi/front/cron.php && id www-data && php -v'`. Ajustar la ruta si la imagen efectiva difiere; no asumirla en producción.
2. Programar en Windows Task Scheduler, con la cuenta de servicio Docker adecuada y **sin exponer `docker.sock` a un contenedor nuevo**, la ejecución periódica de `docker exec --user www-data glpi php /var/www/glpi/front/cron.php`. Verificar manualmente el comando exacto en un momento seguro antes de activar su repetición. Evitar `--force` porque pasaría por alto la frecuencia.
3. Una vez activo y observado el disparador, cambiar **solo `closeticket`** a modo **CLI** en la interfaz GLPI, evitando que otro ejecutor dispare la misma tarea. Vigilar en `Logs` su ejecución sin clic en “Ejecutar”, al menos dos intervalos consecutivos, y confirmar con un ticket sintético nuevo en H-20.
4. Documentar cómo se recupera el disparador tras reinicios de Windows/Docker; inspeccionar salud de contenedor, permisos, timeouts, doble ejecución y logs. No activar un despliegue/cron nuevo en la instancia LAN sin comprobar esas precondiciones.

Fuentes oficiales:

- https://help.glpi-project.org/documentation/modules/administration/entities
- https://help.glpi-project.org/documentation/modules/assistance/tabs/solution
- https://help.glpi-project.org/documentation/modules/configuration/crontasks

## Pruebas de aceptación (aisladas)

1. Solicitar ticket nuevo en GLPI original con un perfil solicitante; comprobar que el campo Estado aparece para esa cuenta, que el ticket está vinculado al solicitante y que únicamente se ven sus tickets.
2. Asignar en Ticket Manager; comprobar que GLPI muestra “Asignado” (2).
3. Crear una tarea planificada nativa (`TicketTask`); comprobar GLPI “En proceso (planificado)” (3), inicio/fin con zona local y sin desfase UTC. Probar cambio de hora, teclado, DST y ancho 320/390/768/1366/1920.
4. Poner en espera (4); probar replanificación válida y un solapamiento de agenda. Mostrar el texto real del conflicto 409, sin atribuirlo erróneamente al estado.
5. Guardar una solución escrita. Con cierre automático inmediato activo, ejecutar/verificar `closeticket`, confirmar GLPI (6) y que el Kanban mantiene la tarjeta como “Cerrado”. Comprobar el historial y las notificaciones del solicitante.
6. Probar una petición inválida y un intento de acceso de otro grupo/usuario: debe producir rechazo y **cero mutaciones**. Revisar 401/403, consola y logs, sin contraseñas en evidencias.
7. Comprobar que los tickets ya resueltos/cerrados no reciben una segunda solución. Verificar también un caso con fallo de `closeticket`: la app debe seguir mostrando 5 hasta que GLPI confirme 6.

Estas pruebas mutantes deben correr **solo en el fixture descartable H-20**. No usar el GLPI persistente de la demo para modificar tickets sin el procedimiento y permiso indicados en `AGENTS.md`.

## Gates de esta revisión (sin despliegue)

| Gate | Resultado local |
| --- | --- |
| Frontend `pnpm typecheck` | PASS |
| Frontend `pnpm lint` | PASS |
| Frontend `pnpm test:unit` | PASS, 16/16 |
| Frontend `pnpm test:e2e:guard` | PASS, 68/68 |
| Frontend `pnpm build` | PASS, avisos no bloqueantes de Rollup (anotaciones externas y chunk de más de 500 kB) |
| Backend .NET 10 | NO EJECUTADO: SDK/contendor Docker no disponibles en este ejecutor |
| E2E H-20 real | NO EJECUTADO: Docker/fixture ausentes; se añadió regresión para el nuevo selector de planificación |
| QA con navegador contra LAN | PASS parcial: login con los 8 perfiles de demo, vistas por rol, tableros, detalle, aislamiento entre grupos y Kanban móvil. Los cambios nuevos de la rama no están desplegados. |
| GLPI LAN / lectura de estados | PASS: estado visible para Self-Service y Ticket Manager. |
| GLPI Self-Service / creación | PASS parcial: formulario y categorías, incluido «Acceso a sistema», accesibles; no se envió ticket nuevo. |
| `closeticket` y cierre #1033 | PASS de ejecución manual/historial/lectura; **recurrencia automática BLOCKED**: la próxima ejecución de 13:42 estaba vencida y no había ejecución nueva al menos hasta la revisión de la lista con otros jobs en 13:54. |

**No usar esta tabla como certificado de aptitud total para la demo:** el estado del código nuevo no coincide aún con el desplegado en LAN. Primero publicar esta rama, correr CI, revisar y desplegar con respaldo y reversión, y repetir las pruebas contra la versión efectivamente desplegada.

## Hallazgos de QA exploratorio por rol — navegador conectado

| Caso reproducido | Resultado y seguimiento |
| --- | --- |
| `user_test` en `/tickets` | Mostraba “12 tickets abiertos” incluyendo cerrados. **Corregido en rama** a “registrados, incluidos resueltos y cerrados”. |
| `user_test` en detalle móvil #1033 | Controles de cambio de estado bloqueados pero visibles. **Corregido en rama** con tarjeta informativa de solo lectura y estado GLPI. |
| `lider_bi` intenta consultar #1032 (Desarrollo) | Acceso denegado correctamente, pero mensaje interno en inglés exponía IDs. **Corregido en rama**: 403 genérico y seguro. |
| `tech_dev` en #1032, estado 4 | Tarea #29 pendiente con horario previo; nueva planificación puede chocar con esa misma tarea y devolver **409**. **Pendiente de solución del dominio en H-20**, sin borrar ni duplicar tareas persistentes. |
| Detalle en estado 4 | El selector permitía únicamente ir a Planificado (3), aunque la API exige primero Asignado (2); era una transición imposible. **Corregido en rama**: botón «Reanudar a Asignado», selector coherente con H-39 y regresión E2E. Esta corrección evita el bloqueo del selector; **no** automatiza todavía la replanificación de una tarea previa ni confirma GLPI 3. |
| `tech_sd` en #13 | El ticket figura en estado 3 pero el API de tareas dice “No hay tareas registradas en GLPI”. **Investigar** si es dato sintético heredado o incoherencia. |
| `tech_bi` en `/queue` / Kanban móvil | La cola está restringida al grupo BI; se comprobó tabulación responsive y ausencia de desborde horizontal visible. PASS parcial. |
| `user_test` en GLPI original | Self-Service con listado de estados y formulario «Reportar un problema»; categorías incluyen «Acceso a sistema». PASS de lectura/apertura; **no se envió** una petición. |

Sesiones autenticadas sin registrar contraseñas: `admin_test`, `user_test`, `lider_sd`, `tech_sd`, `lider_dev`, `tech_dev`, `lider_bi`, `tech_bi`. Son pruebas exploratorias realizadas por agente, **no QA manual humano ni E2E aislado completo**.
