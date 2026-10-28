# Manual de pruebas — H-64

> **Control documental ISO 9001**
> **Código:** DOC-QA-MAN-H64 | **Versión:** 1.0.0 | **Fecha:** 2026-10-28
> **Autor:** Codex | **Revisión:** Codex (QA automatizada y revisión visual) | **Estado:** validado para entrega H-64

## Alcance y evidencias

Cubre identidad GSI, login, navegación, modales, filtros, tarjetas móviles y notificaciones. Los metadatos permiten control documental; no acreditan certificación ISO ni una auditoría de conformidad. H-64 no modifica lógica de negocio, permisos, endpoints ni payloads.

Registrar commit, navegador y versión, responsable, fecha/hora y viewport antes de informar resultados. Asociar capturas y logs al caso y commit evaluados. No incluir credenciales o tokens en evidencias. Todos los casos de esta versión están pendientes; completar el registro solo después de ejecutarlos.

## Preparación

1. Disponer de cuenta técnica y otra autorizada para Mi Equipo y reapertura. Utilizar tickets QA con estados adecuados.
2. Comprobar frontend, API, GLPI, MariaDB y PostgreSQL. Playwright apunta a `http://localhost:5173`; su preparación restablece fixtures y preferencias de usuarios QA mediante `glpi-db` y `glpi-app-db`.
3. Usar el entorno de pruebas previsto para evitar alterar tickets operativos. Preparar viewports 1440×900 y 390×844; revisar también el límite 767/768 px.

## Matriz de aceptación

| ID | Requisito y pasos | Resultado esperado / evidencia |
| --- | --- | --- |
| H64-QA-01 | Abrir login y revisar título y petición del icono. | «GLPI Ticket Manager» e isotipo GSI sin 404. El alias público `isotipo-gsi.png` reutiliza el recurso GSI existente. |
| H64-QA-02 | Revisar login en ambos tamaños y temas. | Logo arriba a la izquierda, sin texto promocional grande ni etiquetas antiguas; olas sutiles, formulario legible. Captura escritorio. |
| H64-QA-03 | Visitar Mi Equipo y detalle de ticket. | Breadcrumb en cabecera sin duplicado en PageHeader; H1 visible. Revisar navegación por teclado. |
| H64-QA-04 | Alternar Sol/Luna y recargar. | Claro/oscuro cambia y persiste; sin dropdown duplicado de presets en cabecera. |
| H64-QA-05 | Abrir Pendiente, enfocar y abandonar campos. | Ningún error por foco/blur antes de enviar. Captura limpia. |
| H64-QA-06 | Confirmar Pendiente vacío, después solo motivo y finalmente motivo/comentario válidos. | Vacío muestra ambos errores sin mutación; motivo solo deja error de comentario. Datos válidos conservan operación y cierre tras éxito. Captura inválida. |
| H64-QA-07 | En Resolver, enfocar/abandonar, confirmar vacío y resolver con «OK». | Sin error prematuro; error al enviar vacío sin petición. Solución corta válida conserva flujo y protección frente a doble envío. Captura inválida. |
| H64-QA-08 | Abrir Reapertura con rol permitido; probar sin motivo y con motivo. | Motivo opcional, máximo 500 caracteres; no aparece error de obligatoriedad; vuelve a Asignado. Captura previa al envío. |
| H64-QA-09 | Corregir error, cancelar, abrir de nuevo; usar Tab y Escape. | Errores anteriores no reaparecen prematuramente; foco visible y sin recortes. Durante resolución en curso no se cierra el diálogo. |
| H64-QA-10 | Combinar técnico, estado y fechas en Mi Equipo; limpiar filtros. | Barra coherente adaptable; misma selección de tickets que antes, restablecimiento completo. Captura de filtros. |
| H64-QA-11 | Abrir calendario inicio/fin, cambiar mes y seleccionar. | Popover consistente, hover/selección visibles y límites de rango respetados. Valores locales `YYYY-MM-DD`. Captura abierta. |
| H64-QA-12 | Operar calendario con teclado y cerrar con Escape/clic externo. | Foco visible, operación sin ratón, cierre sin cambios involuntarios y panel dentro de pantalla, incluido móvil. |
| H64-QA-13 | Comparar escritorio, 767/768 px y móvil; abrir tarjeta. | Tabla desde `md`, tarjetas a ancho completo por debajo con ID, título, estado y técnico, acción táctil amplia, sin duplicados visibles ni scroll horizontal de página. Captura móvil. |
| H64-QA-14 | Abrir campana con leídas/no leídas y marcar una. | Panel dentro del viewport, fondo card translúcido, padding cómodo y distintivo no leído; marcado y contador conservados. Captura del panel. |
| H64-QA-15 | Ejecutar controles y revisar versión desplegada. | Typecheck/build sin errores, suite completa con resultados reales; Nginx sirve recursos nuevos y capturas corresponden al commit entregado. |

## Controles automatizados

Desde `frontend/`, en el checkout que se entregará:

```powershell
pnpm typecheck
pnpm build
npx playwright test
```

Objetivo solicitado: **40/40 aprobadas**. Registrar total descubierto, aprobadas, fallidas, omitidas y reintentos reales. No reducir casos ni introducir omisiones para alcanzar la cifra. Actualizar expectativas solo cuando describen el nuevo requisito de confirmar antes de validar.

Playwright produce `frontend/playwright-report/` y `frontend/test-results/` con JSON/JUnit y artefactos según configuración. Conservar log y commit. Las capturas de aceptación deben generarse expresamente: las automáticas normales solo se toman al fallar.

Ejecutar GitNexus `detect-changes --scope all` antes de cerrar o hacer commit y registrar riesgo y limitaciones del índice. Tras comprobar el mismo código, publicar `dist` en `glpi-lan-frontend`, validar configuración Nginx y recargar. Verificar por HTTP título, favicon y JS generado, más revisión visual. Identificar commit en `main`, push y contenedor verificado.

## Registro de ejecución

| Campo | Registro |
| --- | --- |
| Versión evaluada | H-64, contenido de este commit; base `f7d3a6d`. Integración directa en `main`. |
| Responsable, fecha/hora, navegador y viewports | Codex; 2026-10-28; suite 20:19–20:25 Europe/Paris; Chromium; 390/767/768/1440 px. |
| Typecheck / build | Aprobados, código de salida 0. Build Vite/PWA completo. Advertencias no bloqueantes de tamaño de bundle y anotaciones PURE de SignalR. |
| Playwright: total / aprobadas / fallidas / omitidas | 40 / 40 / 0 / 0; 0 flaky; 352,65 s; ejecución completa sin reintentos locales. |
| GitNexus y limitaciones | Índice actualizado: 4.372 nodos / 9.112 aristas. detect-changes: crítico, 34 flujos; componentes compartidos. Limitaciones de inferencia entre lenguajes/presupuesto documentadas en ADR-024. |
| Casos H64-QA-01 a H64-QA-15 e incidencias | Aprobados en los alcances automatizados/visuales descritos. Primera suite 36/40 detectó expectativas antiguas y foco/breadcrumb; corregidos y suite completa final 40/40. |
| Rutas de capturas y reportes | `docs/qa/evidence/H64/`: ocho capturas, resumen JSON y JUnit de la ejecución final. Capturas repetidas contra Nginx en puerto 80. |
| Nginx y smoke test | dist copiado a `glpi-lan-frontend`; nginx -t y recarga correctos. HTTP 200, título/favicon y bundle comprobados. SHA256 JS local/contenedor idéntico: `2b38489b3e3d99d6322cc75ba26c868ddc83f2550d5baafd5868ac6778a5aa23`. |
| Revisión de liberación | Sin cambios en lógica de negocio. Revisión de seguridad del diff sin hallazgos nuevos. Publicación Git registrada por el commit de entrega H-64. |

## Evidencias visuales H-64

- [Login mínimo](evidence/H64/login.png).
- [Pendiente sin errores iniciales](evidence/H64/modal-pending.png).
- [Pendiente tras confirmar vacío](evidence/H64/modal-pending-validation.png).
- [Resolver tras confirmar vacío](evidence/H64/modal-resolve.png).
- [Reapertura con motivo opcional](evidence/H64/modal-reopen.png).
- [Filtros y calendario](evidence/H64/team-filters-calendar.png).
- [Tarjetas móviles](evidence/H64/team-mobile-cards.png).
- [Notificaciones](evidence/H64/notifications.png).

## QA suplementario ejecutado

Chromium, 2026-10-28: calendario con flecha + Enter selecciona la fecha; límites desde/hasta deshabilitan valores fuera de rango y restringen navegación por teclado; Escape cierra y restaura foco; Limpiar elimina ambas fechas. Axe del diálogo calendario: cero violaciones en escritorio y móvil, modo claro y oscuro. Panel móvil 320 × 403 dentro de viewport 390 × 844.

Tarjetas visibles a 390/767 px y tabla a 768/1440 px; ancho del documento igual al viewport en los cuatro tamaños. Un único Sol/Luna visible por viewport, sin dropdown de presets; alternancia y persistencia tras recargar verificadas. Verificación de formularios vacíos sin llamadas inválidas y éxito posterior cubierta por las pruebas E2E actualizadas, sin reducir casos.

Reportes: [resumen Playwright](evidence/H64/playwright-summary.json) y [JUnit](evidence/H64/playwright-junit.xml).
