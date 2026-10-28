# Reporte de Aseguramiento de Calidad (QA) — Misión H-59
**ID de Control:** QA-ISO-H59-2026-10-28  
**Responsable:** @tech-lead (Antigravity v2)  
**Estado:** `STATUS: APPROVED 🟢`

---

## 1. Resumen Ejecutivo
En la misión **H-59**, se corrigieron tres fricciones críticas de experiencia de usuario en dispositivos móviles:
1. **Prevención de Auto-Zoom en Celular ([index.html](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/frontend/index.html) & [index.css](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/frontend/src/index.css)):**
   - Actualizado el meta tag a `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />`.
   - Incorporada regla CSS para dispositivos móviles (`@media screen and (max-width: 768px)`) estableciendo `font-size: 16px` en inputs, selects y textareas para erradicar el auto-zoom nativo de iOS Safari.
2. **Push Notifications en iOS / PWA ([NotificationBell.tsx](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/frontend/src/components/layout/NotificationBell.tsx)):**
   - Detección explícita de iOS y modo *standalone* (PWA instalada en pantalla de inicio).
   - En navegadores iOS no instalados, se presenta un toast instructivo claro: *"Para recibir notificaciones en tu iPhone, primero debes instalar la app. Toca el botón Compartir y selecciona 'Agregar a pantalla de inicio'."*
   - Manejo refinado de denegación de permisos y feedback en español.
3. **Mitigación Definitiva de Errores 429 ([main.tsx](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/frontend/src/main.tsx) & [apiClient.ts](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/frontend/src/lib/apiClient.ts)):**
   - Implementado en `QueryClient` `retry: shouldRetry` bloqueando reintentos ante códigos 429 y errores deterministas 4xx.
   - Configurado `retryDelay` con retroceso exponencial (`Math.min(1000 * 2 ** attemptIndex, 30000)`).
   - Verificada la reconexión automática en SignalR (`withAutomaticReconnect`) sin bucles de reintento en ráfaga.

---

## 2. Evidencias de Pruebas Visuales Automatizadas
Ejecutadas mediante `frontend/tests/qa/h59-verification.mjs`:
- **Meta Viewport:** Validado `maximum-scale=1.0` y `user-scalable=no`.
- **Captura Login Mobile:** [`docs/qa/evidencias-h59/h59-1-login-mobile-nozoom.png`](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/evidencias-h59/h59-1-login-mobile-nozoom.png)
- **Captura Kanban Mobile:** [`docs/qa/evidencias-h59/h59-2-kanban-mobile.png`](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/evidencias-h59/h59-2-kanban-mobile.png)
- **Captura Notificación Push iOS:** [`docs/qa/evidencias-h59/h59-3-push-ios-prompt.png`](file:///c:/Users/DEVELOPMENT/Desktop/sistema%20opensourceglpi/docs/qa/evidencias-h59/h59-3-push-ios-prompt.png)

---

## 3. Matriz de Cobertura E2E (Playwright)
- **Suite ejecutada:** 40 tests sobre Chromium.
- **Resultado:** **40 passed (100% verde)** en 8.1m.
- **Compilación de producción:** `tsc --noEmit && vite build` completada exitosamente sin advertencias críticas.
- **Despliegue:** Artefactos sincronizados en caliente a `glpi-lan-frontend:/usr/share/nginx/html/` con `nginx -s reload`.
