# Matriz QA final — GLPI Ticket Manager

> Ejecutor: **agente automatizado (Playwright + suites .NET)**. No hubo QA manual humana.
> Fecha: 2026-11-05 | Commit: `main` `433c6c2` | Despliegue: LAN `10.10.40.31`
> Artefactos: `scratch/final-qa/artifacts/2026-11-05T21-14-16-504Z/` (QA por rol) y `scratch/final-qa/artifacts/boss-sim-2026-11-05T21-41-44-430Z/` (simulación del jefe).

## 1. Resumen

| Suite | Ejecutado por | Resultado |
| --- | --- | --- |
| Aplicación (.NET) | CI local Release | 57/57 PASS |
| Integración API (.NET) | CI local Release | 227/227 PASS |
| E2E Playwright (fixture H-20) | CI | 45/45 PASS |
| QA navegador por rol | Agente | 35/35 PASS |
| Simulación del jefe (sesión limpia) | Agente | 12/12 PASS |
| Verificación post-despliegue | Agente | 9/9 PASS (repetida tras reinicio completo) |
| Lint frontend | Agente | `eslint src` sin hallazgos |

## 2. Cuentas y roles

| Cuenta | Rol | Grupo | Resultado |
| --- | --- | --- | --- |
| `user_test` | Solicitante | — | PASS, aterriza en `/tickets` |
| `tech_dev` | Técnico | Desarrollo | PASS, `/kanban` |
| `tech_bi` | Técnico | BI | PASS, `/kanban` |
| `tech_sd` | Técnico | Service Desk | PASS, `/kanban` |
| `lider_dev` | Supervisor | Desarrollo | PASS, `/kanban` |
| `lider_bi` | Supervisor | BI | PASS, `/kanban` |
| `lider_sd` | Supervisor | Service Desk | PASS, `/kanban` |
| `admin_test` | Administrador | — | PASS, `/kanban` |

## 3. Casos de navegador (35)

### Cuentas

| # | Caso | Resultado |
| --- | --- | --- |
| 1–8 | Login de las 8 cuentas demo con redirección correcta | PASS |
| 9 | Las 8 cuentas autentican | PASS |

### Seguridad

| # | Caso | Resultado |
| --- | --- | --- |
| 10 | Solicitante no accede a Kanban ni Administración (`url=/tickets`) | PASS |
| 11 | `tech_bi` solo ve su grupo con `groupId=3` manipulado | PASS |

### Flujos

| # | Caso | Resultado |
| --- | --- | --- |
| 12 | Kanban del técnico muestra Service Desk | PASS |
| 13 | Ticket creado desde GLPI original (formulario nativo, Hardware), 13,1 s | PASS |
| 14 | ID de ticket recuperado de la tarjeta (#1031) | PASS |
| 15 | Categoría Hardware enruta a Service Desk (id 3) | PASS |
| 16 | Asignación: GLPI status 2 + tarjeta en Asignado | PASS |
| 17 | Estado Asignado sin etiqueta «En proceso ejecución» | PASS |
| 18 | Planificación real: GLPI 3 + `TicketTask` existente (`tasks=1`) | PASS |
| 19 | Tarea visible en la línea de tiempo | PASS |
| 20 | Pausa: GLPI 4 + tarjeta en Pendiente | PASS |
| 21 | Reanudación desde Pendiente: nueva planificación y GLPI 3 | PASS |
| 22 | Resolución: GLPI 5 sin cierre automático | PASS |
| 23 | Ticket cerrado visible en historial (`/tickets?status=6`) | PASS |
| 24 | Kanban móvil distingue Asignado y En proceso | PASS |

### Tiempo real

| # | Caso | Resultado |
| --- | --- | --- |
| 25 | Ticket nuevo aparece en Kanban sin recargar (3,97 s) | PASS |
| 26 | Supervisor ve el ticket sin recargar (`/equipo`) | PASS |
| 27 | Contador del supervisor cambia en vivo (Total 8 → 9) | PASS |
| 28 | Tarjeta se mueve a Asignado sin recargar | PASS |
| 29 | Cierre en GLPI retira la tarjeta sin recargar (548 ms) | PASS |

### PWA y calidad

| # | Caso | Resultado |
| --- | --- | --- |
| 30 | Manifest servido con `display: standalone` (192×192, 512×512) | PASS |
| 31 | SW en HTTPS LAN bloqueado por CA no confiable | PASS con bloqueo documentado (no se instaló CA raíz) |
| 32 | SW registrado en contexto seguro (loopback, `active: true`) | PASS |
| 33 | Push API disponible, permiso no concedido | PASS con limitación (requiere acción del usuario) |
| 34 | Sin errores HTTP 5xx en la QA | PASS |
| 35 | Sin errores de consola inesperados | PASS |

## 4. Simulación del jefe (12)

| # | Caso | Resultado |
| --- | --- | --- |
| 1 | Sesión limpia redirige a login | PASS |
| 2 | `admin_test` inicia sesión | PASS |
| 3 | Panel de equipo con métricas | PASS |
| 4 | Listado de tickets accesible | PASS |
| 5 | Historial del ticket QA #1031 | PASS |
| 6 | Ayuda y guía de uso | PASS |
| 7 | `user_test` inicia sesión como solicitante | PASS |
| 8 | Solicitante ve sus tickets (filas cargadas) | PASS |
| 9 | GLPI original operativo con `user_test` | PASS |
| 10 | HTTPS LAN responde 200 (certificado autofirmado) | PASS |
| 11 | Sin errores de consola | PASS |
| 12 | HTTPS SW bloqueado por CA autofirmada | PASS con limitación conocida |

## 5. Verificación post-despliegue (9)

| # | Comprobación | Resultado |
| --- | --- | --- |
| 1 | Raíz del Ticket Manager 200 | PASS |
| 2 | `/api/health` 200 | PASS |
| 3 | `/api/health/ready` 200 | PASS |
| 4 | GLPI `:8081` 200 | PASS |
| 5 | `/api/auth/me` sin sesión 401 | PASS |
| 6 | Cola de `tech_sd` autenticada | PASS |
| 7 | Dashboard de `lider_sd` | PASS |
| 8 | Listado de `user_test` | PASS |
| 9 | Negociación SignalR autenticada | PASS |

Repetida 9/9 tras reiniciar toda la pila. Durante el reinicio intencional de la base de datos aparecieron dos avisos transitorios de conexión del watcher; se recuperaron solos y la verificación posterior fue 9/9.

## 6. Matriz de autorización (deny-by-default)

| Recurso | Solicitante | Técnico | Supervisor | Admin |
| --- | --- | --- | --- | --- |
| Mis tickets | ✅ propios | — | — | ✅ |
| Cola de su grupo | ❌ | ✅ | ✅ | ✅ |
| Kanban de otro grupo | ❌ | ❌ | ❌ | ✅ |
| Detalle de ticket ajeno | ❌ | ❌ | ❌ | ✅ |
| Mi Equipo / métricas | ❌ | ❌ | ✅ su grupo | ✅ |
| Administración | ❌ | ❌ | ❌ | ✅ |
| Mover estado / planificar | ❌ | ✅ asignados/grupo | ✅ grupo | ✅ |

Comprobado además con parámetros de grupo manipulados (`groupId=3`) y con peticiones sin sesión (401).

## 7. Estados no verdes

| Elemento | Estado | Motivo exacto |
| --- | --- | --- |
| Push a nivel de sistema operativo | NOT_VERIFIED | Sin permiso de notificaciones concedido ni dispositivo/PWA suscrita; el backend y el service worker sí están verificados. |
| Service worker en HTTPS LAN | BLOCKED (limitación) | CA autofirmada no confiada en el equipo cliente; no se instaló CA raíz. |
| E2E en el host local | BLOCKED | Memoria insuficiente en el host; la ejecución autoritativa es CI (45/45). |
| QA manual humana | No ejecutada | Toda la verificación fue automatizada por agente. |
