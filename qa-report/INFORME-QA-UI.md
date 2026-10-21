# Informe de QA Manual / Visual — Auditoría de Interfaz

**Fecha:** 21 de octubre de 2026
**Autor:** Auditoría automatizada de UI (navegador real, interacción tipo humana)
**Alcance:** Sistema OpenSource GLPI desplegado en LAN
**Apps auditadas:**
- **Service Desk (React)** → `http://10.10.40.25` (contenedor `glpi-lan-frontend`)
- **GLPI nativo 11.0.11** → `http://10.10.40.25:8081` (contenedor `glpi`)

**Usuarios:**
- Solicitante: `solicitante_test` / `Soli123!`
- Técnico: `tecnico_test1` / `Tec123!`

**Método:** Interacción exclusivamente por GUI (clic, escritura, teclado real). **Sin SQL, sin `curl`, sin inyección de datos por API.** Toda la evidencia proviene de capturas de pantalla, árbol de accesibilidad, inspección de red (peticiones realmente emitidas por la app) y consola del navegador.

---

## 1. Resumen ejecutivo

| Flujo | Descripción | Estado |
|:-----:|-------------|:------:|
| **1** | Crear ticket en GLPI como solicitante con categoría **Hardware** | ❌ **BLOQUEADO** |
| **2** | Ciclo técnico: asignar → en progreso → resolver + solución | ✅ **PASA** |
| **3** | Tiempo real (SignalR) sin recargar | ⚠️ **PARCIAL** |
| **4** | Estrés UX (formularios vacíos, retroceso, móvil, consola) | ✅ **PASA** (con hallazgos) |

**Hallazgo principal:** El flujo de creación de tickets del solicitante está **roto por configuración de GLPI**: el desplegable **Categoría no tiene ninguna opción** (solo el marcador vacío) aunque el campo está marcado como **obligatorio**. Esto hace **imposible** crear un ticket desde el portal de autoservicio y, en consecuencia, **impide verificar el flujo 1 y la animación en tiempo real del flujo 3**.

**Hallazgo secundario relevante:** El Kanban **anuncia arrastrar-y-soltar** (*"Arrastra un ticket entre columnas…"*) pero **ninguna tarjeta es arrastrable**: no existe la funcionalidad.

---

## 2. Flujo 1 — Crear ticket como solicitante ❌ BLOQUEADO

### Pasos ejecutados
1. ✅ Login en GLPI nativo como `solicitante_test` → redirige a `/Helpdesk` (Inicio).
2. ✅ Aparecen los accesos exigidos: **"Reportar un problema"** y **"Solicitar un servicio"** (además de "Crear una petición" → Catálogo de servicios).
3. ✅ Clic en **"Reportar un problema"** → abre `/Form/Render/1`.
4. ⚠️ Se rellenan **Título** = `Falla de prueba QA UI` y **Descripción** = `Probando el flujo desde el navegador`.
5. ❌ **No existe la categoría "Hardware".** El desplegable **Categoría** contiene **una sola opción: `-----` (vacío)**.
6. ❌ Al pulsar **Enviar**, la validación responde **"Este campo es obligatorio"** para **Categoría** → el ticket **no se crea**.

**Evidencia por captura:** `shots/02-glpi-form-reportar-problema.png`, `shots/03-glpi-form-solicitar-servicio.png`

**Evidencia técnica (desde la página, sin SQL):**
- El `<select name="answers_2[items_id]">` tiene `optionCount: 1`, valor `0`, texto `-----`.
- El desplegable es Select2 **AJAX** (`type: 'ajax'`, `itemtype: "ITILCategory"`, `url: '/ajax/getDropdownValue.php'`).
- Consultando ese endpoint **desde la propia página**: `HTTP 200` con **cuerpo vacío (0 bytes)** → **cero categorías**.

### Causa raíz
No es un fallo del frontend. Es un **problema de datos/configuración en GLPI**: no hay **ITILCategory** disponibles para el solicitante, pero el formulario las marca como **obligatorias**. Es un estado imposible: el usuario no puede completar el formulario.

> El problema es **global**, no de un formulario concreto: ocurre igual en **"Reportar un problema"** (`/Form/Render/1`) y en **"Solicitar un servicio"** (`/Form/Render/2`) y desde el **Catálogo de servicios**.

### Impacto
- **Bloquea por completo** el alta de tickets de autoservicio.
- **Bloquea el flujo 3**, que depende de crear un ticket "Prueba Tiempo Real".
- **Relacionado con el fallo de resolución histórico:** los tickets creados con `itilcategories_id = 0` hacen que GLPI rechace la solución con `400 "Mandatory fields are not filled."` → API `502`. La falta de categorías es la raíz común.

### Recomendación
1. **Poblar el árbol de ITILCategory** en la entidad correspondiente (o ajustar la/s condición/es del formulario que hoy las excluye todas).
2. **Hacer coherente la validación**: si no hay categorías, el campo no debería ser obligatorio (o el formulario no debería ofrecerse).
3. **Corregir los datos semilla**: los tickets con categoría vacía (`#58`–`#72`) no pueden resolverse.

---

## 3. Flujo 2 — Ciclo técnico completo ✅ PASA

Ejecutado en el **Service Desk React** con `tecnico_test1`.

| Paso | Resultado | Evidencia |
|------|:---------:|-----------|
| Login técnico | ✅ | `/kanban`, "Conectado en tiempo real" |
| Ver Kanban / Cola del grupo | ✅ | Columnas: Cola del grupo, Mis tickets, En progreso, Pendiente, Resuelto |
| **Asignarme** (cola → mis tickets) | ✅ | Cola 6→5, Mis tickets 6→7 |
| **Iniciar** (mis tickets → En progreso) | ✅ | `PATCH /api/tickets/317/status` → **204**, En progreso 0→1 |
| Abrir modal **Resolver** | ✅ | Diálogo con texto de ayuda correcto |
| Escribir solución + **Resolver** | ✅ | Ver secuencia abajo |
| Modal se cierra | ✅ | `dialogOpen: false` |
| Tarjeta se mueve a **Resuelto** | ✅ | En progreso 1→0, Resuelto 8→9, `#317` presente |
| **Toast de éxito** | ✅ | *"Ticket resuelto correctamente — El ticket #319 ha sido marcado como resuelto."* |

### Secuencia de red verificada (3 resoluciones consecutivas, idénticas)

```
POST /api/tickets/{id}/solutions   → 201   (solución PRIMERO)
PATCH /api/tickets/{id}/status     → 204   (estado DESPUÉS)
```

Comprobado para **#317**, **#319** y **#321** — **sin 502, sin 422**. La corrección de la secuencia (soluciones antes que estado) funciona de forma reproducible.

**Capturas:** `shots/05-console-kanban.png`, `shots/08-console-ticket-detalle.png`

### Observaciones UX positivas
- El modal explica **por qué** la solución no puede quedar vacía ("sin solución el ticket no puede marcarse como resuelto").
- Los estados intermedios (En progreso, Pendiente) tienen microcopy claro: *"Trabajando"*, *"Esperando"*.
- La consola del Service Desk quedó **100% limpia** durante todo el flujo (0 errores, 0 peticiones fallidas).

---

## 4. Flujo 3 — Tiempo real (SignalR) ⚠️ PARCIAL

### Lo que **sí** se pudo verificar
| Comprobación | Resultado |
|---|---|
| Negociación SignalR `POST /hubs/tickets/negotiate` | ✅ 200 |
| Actualización a WebSocket `ws://10.10.40.25/hubs/tickets` | ✅ **101 Switching Protocols** *a través de nginx* |
| Cabeceras de upgrade | ✅ `connection: upgrade`, `upgrade: websocket`, `sec-websocket-accept`, `server: nginx` |
| Indicador en la UI | ✅ **"Conectado en tiempo real"** |
| **Tráfico de protocolo SignalR capturado** | ✅ `{}` (handshake) y `{"type":3,"invocationId":"0","result":null}` (completado de invocación) |
| Reconexión tras navegar | ✅ Pasa brevemente por *"Desconectado"* / *"Conectando al servidor…"* y **se reconecta solo** |

> **La infraestructura de tiempo real está sana.** El socket está abierto, vivo y **intercambiando mensajes del protocolo SignalR**. El `map $http_upgrade $connection_upgrade` de nginx funciona: el 101 vuelve **a través de nginx**, no de un acceso directo al backend.

### Lo que **no** se pudo verificar
- ❌ **No se pudo observar una tarjeta apareciendo sola** (con animación/highlight) tras crear un ticket desde otra pestaña.

### Motivo (no es culpa del frontend)
El flujo 3 depende de **crear un ticket nuevo**. Como el **flujo 1 está bloqueado** (no hay categorías), **no es posible crear el ticket "Prueba Tiempo Real"**. Además, no es viable abrir una **segunda sesión realmente independiente** con el mismo navegador (cookies compartidas → misma sesión de técnico).

**Recomendación de verificación posterior:** una vez pobladas las categorías, repetir con **dos contextos de navegador separados** (o dos máquinas) para confirmar la animación de la tarjeta entrante.

---

## 5. Flujo 4 — Estrés UX ✅ PASA (con hallazgos)

### 5.1 Formulario vacío — Service Desk
Pulsar **Resolver** con la solución **vacía**:
- ✅ El modal **permanece abierto**.
- ✅ **Cero peticiones de red** (no se desperdicia una llamada a la API).
- ✅ El mensaje de guía sigue visible.

**Buen comportamiento**: se bloquea en cliente sin round-trip innecesario.

### 5.2 Formulario vacío — GLPI nativo
Pulsar **Enviar** en vacío → muestra **"Este campo es obligatorio"** en Categoría y Descripción.
- ✅ Funciona (validación servidor vía `POST /Form/ValidateAnswers` → 200).
- ⚠️ **Mensajes inconsistentes**: en la primera pulsación solo aparecen asteriscos `*`; los textos de error completos aparecen en el segundo intento.

### 5.3 Retroceso desde un estado avanzado
En el **detalle de ticket**, botones de estado: Nuevo / Asignado / Planificado / Pendiente / Resuelto / Cerrado.
- El **estado actual** aparece deshabilitado (correcto).
- **Todos los demás** están habilitados — incluso saltos hacia atrás.

**Prueba real:** ticket `#317` en estado **Cerrado** → clic en **"Pendiente"**:
- ✅ `PATCH /api/tickets/317/status` → **403**
- ✅ **Toast claro:** *"No tienes permiso para realizar esta acción — Solo un administrador puede reabrir un ticket cerrado."*
- ✅ El estado **no cambió**.

> **Excelente diseño defensivo**: el backend **impide** reabrir tickets cerrados y lo **explica con precisión**. La UI no muestra el botón deshabilitado, pero el guardado funciona y se comunica bien.
>
> ⚠️ **Mejora sugerida:** deshabilitar proactivamente los botones de retroceso no permitidos, para evitar el viaje de ida y vuelta con 403.

### 5.4 ❌ **Defecto UX: arrastrar-y-soltar anunciado pero inexistente**
- La interfaz del Kanban afirma: **"Arrastra un ticket entre columnas para cambiar su estado según el flujo operativo."**
- La realidad:
  - `document.querySelectorAll('[draggable=true]').length` → **0**
  - No hay librería de drag&drop cargada (`hasDndLib: false`)
  - Las tarjetas solo avanzan con botones explícitos: **Asignarme / Iniciar / Resolver**
- En la columna **Resuelto** las tarjetas **no tienen ningún control** (ni botón ni enlace de acción).

**Recomendación:** o **implementar** el arrastrar-y-soltar, o **corregir el texto** para describir el uso real (botones). Actualmente la instrucción principal induce a error.

### 5.5 Vista móvil (iPhone 12 ≈ 390×844)
No hay emulación de dispositivo disponible en el entorno; se verificó mediante **reglas responsive reales y elementos móviles**:

- ✅ Sidebar: `fixed … hidden … md:flex` → **oculta en móvil**, visible en ≥768px.
- ✅ **Barra de navegación inferior** móvil-only: `fixed bottom-0 inset-x-0 z-40 … md:hidden`, con **4 accesos**: Kanban, Tickets, **Cola (con contador "5")** y un botón **"Más"**.
- ✅ El botón **"Más"** tiene `aria-label="Abrir menú más opciones"` → **es el equivalente al menú hamburguesa** en móvil (implementado como *overflow*, no como icono hamburguesa).
- ✅ Respeta **`env(safe-area-inset-bottom)`** (muescas de iPhone).
- ✅ Los filtros tienen variante móvil oculta (segundo buscador con ancho 0 en escritorio).
- ⚠️ El Kanban es horizontal (`overflow-x-auto`): en pantalla estrecha obliga a desplazar lateralmente; revisar ergonomía táctil.

### 5.6 Consola y red (DevTools)
| App | Mensajes de consola | Peticiones fallidas | Total |
|---|---|---|---|
| **Service Desk (React)** | **0** | **0** | 15 |
| **GLPI nativo** | **0** | **0** | 47 |

- Se **ignoraron** deliberadamente los ruidos de extensión de navegador (`documentPictureInPicture`, `cnt.js`) conforme a lo indicado.
- Los únicos errores de consola observados fueron los **403 esperados** de mi prueba de retroceso (registro normal del navegador ante una petición rechazada) — la app los manejó con un toast, sin romperse.
- **Sin 500, sin 502, sin CORS.**

> Nota: durante el flujo 2 sí apareció `502` en el histórico de resolución de tickets **sin categoría** (bug ya diagnosticado, ajeno al frontend).

### 5.7 Lighthouse (valor añadido)
| App | Accesibilidad | Buenas prácticas |
|---|:---:|:---:|
| **Service Desk (React)** | **100 / 100** | **100 / 100** |
| GLPI nativo | 93 | 100 |

- **Service Desk:** solo un aviso menor — `td-has-header`: la tabla de Tickets tiene `<th>` pero sin `scope="col"`. Arreglo trivial.
- **GLPI nativo:** contraste de color insuficiente, `<li>` fuera de listas, y nombres accesibles que no coinciden con la etiqueta visible.

### 5.8 Seguridad (cabeceras, valor añadido)
El Service Desk responde con un perfil sólido:
`content-security-policy` (con `connect-src 'self' ws: wss:`), `strict-transport-security` (preload), `x-frame-options: DENY`, `x-content-type-options: nosniff`, `referrer-policy`, `permissions-policy`, `frame-ancestors 'none'`.

### 5.9 Otros hallazgos
- ⚠️ **Mojibake (codificación rota) en GLPI nativo:** se muestra `art?culos`, `t?cnico`, `Categor?a`, `Descripci?n`, `T?tulo`, `petici?n` en lugar de `artículos`, `técnico`, `Categoría`, `Descripción`, `Título`, `petición`. Es un problema de codificación de caracteres de GLPI (no afecta al Service Desk, que muestra acentos correctos).
- ⚠️ **Estado de conexión parpadeante:** al navegar entre páginas el indicador pasa por *"Desconectado"* / *"Conectando al servidor…"* antes de volver a *"Conectado"*. Funcionalmente correcto, pero visualmente inquietante.
- ⚠️ **Ticket basura en el entorno:** existe el ticket **#902 "ASDASDAS"** (creado hoy, sin categoría) en las solicitudes del solicitante → conviene limpiar datos de prueba antes de una demo.

---

## 6. Conclusiones

**Lo que funciona bien**
1. **Ciclo técnico completo y reproducible** (asignar → iniciar → resolver + solución + toast). La corrección *soluciones-antes-que-estado* quedó **validada en navegador real** en 3 tickets.
2. **Tiempo real plenamente operativo a nivel de transporte** (101 por nginx + frames SignalR capturados).
3. **Calidad de frontend sobresaliente**: Lighthouse **100/100** en accesibilidad y buenas prácticas, **consola limpia** en toda la sesión, sin peticiones fallidas.
4. **Guardas de negocio correctas y bien comunicadas** (403 al reabrir cerrado, con mensaje específico).
5. **Diseño responsive real** (sidebar adaptativa + barra inferior móvil con `safe-area-inset`).
6. **Dashboard operativo con datos reales**: KPIs ("Tickets en mi cola 5", "Mis tickets asignados abiertos 11 / 21 en total", "Resueltos por mí hoy 3") y lista "Próximos en la cola", alimentados por `GET /api/dashboard/stats` y `GET /api/tickets/by-group` (**todos 200**).

**Lo que debe corregirse**
1. 🔴 **CRÍTICO — Sin categorías en GLPI** → bloquea el alta de tickets de autoservicio (flujos 1 y 3) y está detrás del fallo de resolución de tickets sin categoría.
2. 🟠 **Kanban anuncia arrastrar-y-soltar que no existe** → instrucción engañosa.
3. 🟠 **Mojibake en GLPI nativo** (`?` en lugar de acentos) → deterioro de imagen y comprensión.
4. 🟡 `scope="col"` ausente en la tabla de Tickets (a11y menor).
5. 🟡 Botones de retroceso no permitidos aparecen habilitados (403 previsible evitable).
6. 🟡 Validación de GLPI muestra solo asteriscos en el primer intento.
7. 🟡 Indicador de tiempo real parpadea a "Desconectado" durante la navegación.
8. 🟡 **Dashboard con carga lenta**: en la primera lectura la página mostraba únicamente el título, sin KPIs ni listas; el contenido apareció tras varios segundos y **sin indicador de carga (skeleton/spinner)**. Convendría mostrar un estado de carga explícito.

**Nada de lo anterior es un fallo del frontend React**, salvo el texto del Kanban y el `scope` de la tabla: los problemas de mayor impacto son de **configuración/datos de GLPI**, cuya propiedad corresponde al equipo de backend/GLPI.

---

## 7. Anexo — Capturas

| Archivo | Contenido |
|---|---|
| `shots/01-glpi-login.png` | Login GLPI nativo |
| `shots/02-glpi-form-reportar-problema.png` | Formulario "Reportar un problema" con **Categoría vacía** |
| `shots/03-glpi-form-solicitar-servicio.png` | Formulario "Solicitar un servicio" con **Categoría vacía** |
| `shots/04-glpi-mis-solicitudes.png` | "Solicitudes" del solicitante (incluye #902 basura) |
| `shots/05-console-kanban.png` | Kanban del técnico (columnas y tarjetas) |
| `shots/06-console-cola.png` | Cola del grupo |
| `shots/07-console-tickets.png` | Lista de Tickets con filtros |
| `shots/08-console-ticket-detalle.png` | Detalle de ticket con botones de estado |
| `shots/09-console-dashboard.png` | Dashboard del Service Desk |
