# Checkpoint de hallazgos reproducidos en QA — 2026-11-09

Rama: `feat/mision-maestra-qa-correcion-integral`.
Base verificada y árbol inicialmente limpio: `d0e0807ab2e7718a0b9c1bbe50a3cc0d622742d3`.
Estado: IMPLEMENTED / VALIDATION_IN_PROGRESS. No merge ni despliegue a la LAN.

Cambios y decisiones:

- P1-01: `/plan` distingue actor y ejecutor; valida asignación, técnico activo y ámbito. Con varios asignados exige selección. La clave de idempotencia incluye ejecutor; el bloqueo persistente y la búsqueda de solapamientos usan su agenda. Reprogramar/completar/cancelar abortan si cambió el ejecutor mientras esperaban su bloqueo. El diálogo Resolver muestra errores de completar y deshabilita la acción para tareas ajenas. La ruta alternativa `/planning` comparte bloqueos y restringe las tareas al ejecutor para el rol técnico.
- P1-02: partición única del Kanban. Nuevo/Asignado sin ejecutor se presenta en Cola conservando su estado GLPI; Asignado con ejecutor se presenta en Asignado. Planificado/Pendiente conservan sus columnas; Resuelto/Cerrado permanecen visibles aun sin técnico. Se deduplican lecturas y se mantiene el ámbito de grupo. No se ofrecen operaciones de trabajo sin ejecutor.
- P2-03 / QA-07: encabezado y paginación consumen la misma colección filtrada completa, también con búsqueda y prioridad.
- P2-04: nombres de participantes obtenidos por Dapper después de autorizar el detalle. Incluye responsables y autores visibles; excluye identidades derivadas exclusivamente de tareas/seguimientos privados cuando no hay permiso. Se eliminan nombres supuestos a partir de IDs fijos y la consulta del directorio global desde el detalle.
- P2-05: disponibilidad proactiva por ejecutor, intervalo y duración, con ocupados, estado libre/ocupado y alternativa comprobada. Actualiza al cambiar selección y cada 15 s. Ambas pantallas de planificación consultan disponibilidad y excluyen solamente la tarea propia autorizada. El guard final 409 y el bloqueo PostgreSQL permanecen; los intervalos contiguos son válidos.
- P3-06: mensajes de conflicto sin horas UTC incrustadas; los intervalos estructurados se presentan en la zona del navegador. El selector conserva el offset real, incluido DST. Persistencia y comparaciones siguen en UTC.
- P3-07: se reinician filtros al iniciar sesión, se eliminan parámetros heredados de retorno y se limpia la caché entre sesiones.

Alcance: endpoints de tickets/planificación → ITicketService/TicketService y TicketPlanningService → repositorios de lectura/GLPI REST/bloqueos PostgreSQL → hooks React, detalle, Kanban, lista y modales. Estos cambios no añaden migraciones ni escrituras SQL al dominio GLPI en código de aplicación.

Impacto: GitNexus local 1.6.12; índice `db54bdc`, rama anterior, por tanto PARCIAL. Último `detect-changes --scope all --limit 5`: 24 archivos rastreados, 84 símbolos y 95 procesos potenciales; clasificación CRITICAL de radio de impacto, no vulnerabilidad demostrada. Se contrastaron definiciones, rutas, consumidores, contratos, SQL y tests con búsquedas manuales. No se reindexó bajo la presión de memoria observada ni se modificaron instrucciones.

Validación confirmada:

- PASS: Release .NET 10 en Linux, 0 errores y 0 advertencias. Windows tiene SDK 9 y no satisface `global.json`; no se cambió su requisito.
- PASS: 92 unitarias y 248 pruebas de integración backend en la versión final, incluida la comprobación adicional del ejecutor tras esperar el bloqueo. TRX guardados en `frontend/e2e-artifacts/backend-final-20261109/`. Las 248 pruebas usan la fábrica de integración con dobles; no se presentan como integración real con GLPI.
- PASS: frontend typecheck, build Vite/PWA y 24 unitarias.
- PASS con advertencias: lint sin errores; dos advertencias preexistentes de dependencias de hooks en TeamDashboard y TechnicianFilter. Build conserva avisos de tamaño de bundle/anotaciones de dependencias.
- PASS: `git diff --check`; revisión proporcional de seguridad con `sec` y de componentes con React Best Practices. Sin patrones de credenciales GitHub en los archivos de código/tests modificados.
- Guards: Windows 101/104 PASS; tres fallos de lanzamiento de Bash/WSL, antes de ejecutar los scripts. Linux con Bash: 98/98 PASS para guard, scripts y cleanup. La comparación aislada adicional de negative-entrypoints en Linux quedó bloqueada por el daemon; sus pruebas sí pasaron en Windows.
- PASS: 85/85 pruebas de guard, entradas negativas y cleanup reejecutadas tras el ajuste del arranque en frío del runner.
- Primera ejecución real H-20 (`18954980ad6153c6df00ae793c7322c2`): 7/9 E2E PASS (grupos, QA-07/contador, privacidad de planificación, rechazo de creación directa, SignalR y filtros móviles). FAIL: el test nuevo de administrador heredó el storageState de tech1; corregido con estado explícitamente vacío. El test concurrente agotó 90 s en POST /plan; aún se investiga y no se atribuye automáticamente al entorno. Se repiten ambos casos con diagnóstico acotado, sin registrar bearer headers.
- Segunda ejecución H-20 (`f2b389b6da5a1b76a88a11c3a23b5fbb`): 3/4 PASS. Concurrencia real: 200 y 409 en 15,2/18,3 s; QA-07 y cambio de identidad P3-07 PASS. El escenario del administrador confirmó ejecutor correcto y nombres autorizados, pero detectó una pérdida de la fecha elegida: la inicialización asíncrona sobrescribía una edición temprana con «ahora + 15 minutos». Se corrigió bloqueando controles hasta completar la inicialización y se repite el flujo completo. No se atribuye ese fallo funcional al entorno.
- Tercera ejecución H-20 (`ac704435c49995b66fab340f2dcc27dd`): confirmó fecha exacta persistida, ejecutor correcto, nombres autorizados y detección proactiva del ocupado con alternativa contigua. Las cinco anchuras no desbordaron el modal. FAIL de accesibilidad: aviso ocupado con contraste 3,76:1, insuficiente para texto normal. La revisión de capturas detectó además truncamiento de los inputs en escritorio. Se corrigieron color y disposición a una columna; la nueva prueba exige ancho útil del input >= 200 px. No se eliminó ninguna regla Axe ni se omitió el fallo; la aserción es blanda para diagnosticar también el resto del flujo, manteniendo el resultado FAIL si reaparece.
- PENDING: planificación real completa, regresión visual/accesibilidad en 360/390/768/1024/1366 y revisión final de capturas. Se añadió `qa-planning-regressions.spec.ts`; sintaxis verificada.

Cobertura transversal: no se presenta esta entrega como una recertificación de todos los flujos del producto. Aceptar/rechazar solución, cierre manual, catálogo, preferencias y notificaciones completas quedan NOT_VERIFIED en navegador para esta versión; la prueba SignalR cubre el aislamiento negativo, no toda la UX de notificaciones. Las pruebas unitarias de partición conservan Cerrado sin técnico (QA-02); no se alteró el ticket original #1029.

Incidencias del entorno: descarga de dependencias y exportación de imágenes superaron el timeout de la fixture en intentos anteriores. Docker devolvió 500/502 y EOF; después volvió a responder sin reinicio solicitado por Codex. Se prepararon capas de construcción por separado y se reintentó con guards intactos. Los intentos fallidos de fixture confirmaron eliminación de sus recursos exclusivos; no se eliminó ni reinició ningún contenedor persistente.

Runner: la primera autenticación nativa de una instalación GLPI limpia superó 10 s bajo la carga observada. Se amplió solamente ese timeout a 30 s, manteniendo todas las validaciones y un límite finito. El siguiente intento pasó autenticación, migración SQL007 y deduplicación de webhooks entre dos procesos API y su reinicio, dentro de la fixture.

Datos originales: no se modificaron ni eliminaron #1027/#1028 ni la tarea #49. Tras fallar el acceso por 4173, se inspeccionó su API local configurada en 5280: #1027 tiene estado 3, asignado a tech_sd (16), grupo 3; #49 sigue Por hacer con ejecutor admin_test (10), inicio `2026-11-10T08:00:00Z` y fin `09:00:00Z` (09:00–10:00 París). #1028 no tiene tareas. No se afirma haber corregido retroactivamente #49. Chrome mostró el acceso de QA; el flujo autenticado de 4173 no está verificado.

Reparación histórica preparada, no ejecutada: la consulta autorizada de disponibilidad para tech_sd (16) devolvió libre ese intervalo. Después de validar/publicar la versión en QA con la aprobación que exige AGENTS.md para entornos persistentes, volver a comprobar estado 3, asignación 16, tarea 49 pendiente/ejecutor 10, fechas intactas y ausencia de colisiones. La operación propuesta conserva tarea, contenido, privacidad y horario:

```http
PUT /api/tickets/1027/planning/49
Content-Type: application/json

{"technicianId":16,"begin":"2026-11-10T08:00:00Z","end":"2026-11-10T09:00:00Z"}
```

Confirmar después ejecutor 16 y estado/fechas intactos mediante lectura GLPI. No completar ni resolver el ticket original para probarlo; las mutaciones de prueba se limitan a H-20.

Hallazgo adicional: configuración Git preexistente con una credencial incrustada. Se expuso accidentalmente durante una inspección; no se copia a este documento ni al código. Revocación/rotación pendiente del titular. No se modificó la configuración protegida ni se intentó revocar acceso sin autorización.

Hallazgo adicional P1: `TicketRepository.ClaimAsync` preexistente actualiza el estado y la asignación mediante Dapper/SQL directo en GLPI. Contradice la regla de mutación mediante REST oficial y puede omitir reglas/historial nativos. No se mezcla su reimplementación con la corrección de planificación: requiere una fase propia con asignación concurrente, permisos y readback GLPI. Bloquea publicación hasta resolverlo; responsable siguiente: Codex, no tarea manual del usuario.

Riesgos: ALTO hasta completar GLPI real/E2E y revisión humana. El bloqueo coordina las réplicas de esta aplicación; escritores externos directos de GLPI no participan en él. Frontend nuevo requiere backend actualizado para disponibilidad. Solicitudes antiguas con claves de idempotencia y hash anterior pueden necesitar conciliación y una nueva operación explícita; no se reintentan escrituras ambiguas automáticamente.

Rollback: revertir únicamente el commit de esta misión; no hay migraciones. Preservar cualquier tarea GLPI creada en entornos persistentes y conciliarla expresamente. No usar reset/clean ni limpiar recursos ajenos.

[CAMBIÓ]: código, contratos y regresiones de tickets/planificación, más este checkpoint.
[AFECTA]: supervisor/administrador → agenda del ejecutor → completar/resolver; filtros e identidades; Kanban de grupos.
[RIESGO]: alto.
[SIGUIENTE]: terminar la fixture H-20 y revisar evidencia; revisión humana antes de publicar. Rotación de la credencial por su titular.
