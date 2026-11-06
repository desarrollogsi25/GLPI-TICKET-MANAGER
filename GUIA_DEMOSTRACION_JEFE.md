# GUÍA DE DEMOSTRACIÓN EJECUTIVA PARA EL JEFE — GLPI TICKET MANAGER v2.0.0

> **Duración recomendada:** 10–15 minutos.
> **Alcance:** Red de laboratorio LAN (`10.10.40.31`).
> **Requisito previo:** Credenciales disponibles en el archivo privado local `ENTREGA_JEFE_PRIVADO.txt` (nunca publicado en Git).

---

## 1. PREPARATIVOS ANTES DE INICIAR

1. Asegúrate de que el equipo cliente esté conectado a la misma red local (`10.10.40.X`).
2. Abre Google Chrome o Microsoft Edge en:
   - **Interfaz Ticket Manager:** `http://10.10.40.31` (o `https://10.10.40.31` para probar Notificaciones Web Push).
   - **GLPI Oficial:** `http://10.10.40.31:8081` (para demostrar que la fuente de verdad siempre es GLPI).
3. Ten a mano la tabla de usuarios de prueba:

| Usuario | Perfil | Destino Inicial | Grupo |
| :--- | :--- | :--- | :--- |
| `admin_test` | Administrador TI | Dashboard Global & Kanban | Todos (Global) |
| `lider_sd` | Supervisor Service Desk | Kanban & Panel "Mi Equipo" | Service Desk |
| `tech_sd` | Técnico Helpdesk | Kanban operativo | Service Desk |
| `tech_bi` | Técnico BI | Kanban operativo | Inteligencia de Negocio |
| `user_test` | Solicitante (Empleado) | Mis Tickets (`/tickets`) | Solicitantes |

---

## 2. GUION PASO A PASO DE LA DEMOSTRACIÓN

### PASO 1: Inicio de Sesión y Dashboard Global (`admin_test`)
* **Acción:** Inicia sesión con `admin_test`.
* **Qué destacar al jefe:**
  - El sistema muestra el **Dashboard Ejecutivo** con métricas consolidadas en tiempo real: tickets abiertos, cerrados, tiempos de respuesta y distribución por grupo.
  - **Prueba del nuevo filtro verificado:** Haz clic en la tarjeta de tickets **«Cerrados»** (27 tickets). Comprueba que el sistema navega instantáneamente a `/tickets?status=6` mostrando todos los tickets cerrados sin bloqueos artificiales, reconociendo el filtro de *"Todos los técnicos"*.

### PASO 2: El Ciclo de Vida y las 5 Columnas del Kanban (`tech_sd`)
* **Acción:** Cierra sesión y entra como `tech_sd`.
* **Qué destacar al jefe:**
  - Visualización del tablero Kanban con las 5 columnas normativas del ciclo de vida GLPI:
    1. *Nuevo*
    2. *Asignado*
    3. *En proceso (planificado)*
    4. *Pendiente*
    5. *Resuelto*
  - Notarás que el ticket cerrado no estorba en el tablero operativo diario, manteniendo limpio el foco del técnico.

### PASO 3: Apertura en GLPI y Tiempo Real Bidireccional (SignalR)
* **Acción:**
  1. En una segunda pestaña o ventana, ingresa a **GLPI original** (`http://10.10.40.31:8081`) como `user_test`.
  2. Crea una nueva incidencia (ej. *"Fallo en impresora de recepción"*).
  3. Vuelve a la pestaña de Ticket Manager sin recargar la página.
* **Qué destacar al jefe:**
  - La tarjeta aparece automáticamente en la columna *"Nuevo"* en menos de 1 segundo vía SignalR.
  - **Regla de oro empresarial:** Se demuestra que Ticket Manager no sustituye el motor de reglas ni la apertura oficial de GLPI, sino que potencia la experiencia operativa de los técnicos.

### PASO 4: Asignación, Planificación de Tareas y Resolución Consistente
* **Acción:**
  1. Como `tech_sd`, haz clic en *"Asignarme"* y luego en *"Planificar"*.
  2. Define una tarea técnica con fecha y hora. Observa cómo la tarjeta se mueve fluidamente a la columna *"En proceso (planificado)"*.
  3. Abre el diálogo de **Resolver**.
* **Qué destacar al jefe (Garantía contra el Error #1042):**
  - El sistema detecta que la tarea técnica está *"Por hacer"*.
  - El diálogo muestra la tarea y ofrece dos alternativas legítimas:
    - Botón rápido `[✓ Completar]` para marcarla como realizada de forma individual.
    - Casilla `[x] Completar tareas pendientes al registrar esta solución` (activada por defecto).
  - Al ingresar la solución y confirmar, el backend completa atómicamente la tarea en GLPI y resuelve el ticket.
  - **Comprobación en GLPI:** Abre el ticket en GLPI (`:8081`): verás que la tarea técnica está marcada como *"Hecho"* (State 2) y la solución está registrada a nombre del técnico humano, eliminando cualquier inconsistencia de datos.

### PASO 5: Trazabilidad de Identidad y Auditoría
* **Acción:** Revisa el historial de soluciones y seguimientos del ticket.
* **Qué destacar al jefe:**
  - La autoría de las intervenciones refleja exactamente el nombre del técnico humano que realizó el trabajo (ej. Elena Morales / `tech_bi`), diferenciándolo claramente de la cuenta de sistema *"Administrador GLPI (Sistema)"*.
  - En el backend, cada acción sensible queda auditada de forma inmutable con su timestamp y User ID en PostgreSQL.

### PASO 6: Aislamiento Multigrupo y Control de Acceso
* **Acción:** Cierra sesión y entra como `tech_bi` (Técnico de BI).
* **Qué destacar al jefe:**
  - El técnico de BI solo visualiza y opera sobre los tickets pertenecientes al área de Inteligencia de Negocios.
  - No puede ver la cola ni planificar sobre tickets de Service Desk o Desarrollo. Si intentara forzar la consulta mediante la URL o la API, el backend responde con `403 Forbidden` garantizando estricto aislamiento corporativo.

### PASO 7: Demostración en Dispositivo Móvil (PWA) y Notificaciones Push
* **Acción:**
  - Abre `http://10.10.40.31` en el navegador del teléfono móvil conectado al WiFi local.
  - Destaca la interfaz responsiva, el diseño adaptado a gestos táctiles y la velocidad instantánea de carga.
  - Para la prueba de Notificaciones Push: accede a `https://10.10.40.31` en Chrome o Edge, acepta la advertencia del certificado de laboratorio local, ve a **Preferencias** y activa el interruptor de notificaciones push para recibir alertas de nuevos tickets en el dispositivo.

---

## 3. PREGUNTAS FRECUENTES DEL JEFE Y RESPUESTAS TÉCNICAS

1. **¿Qué pasa si GLPI se cae o se reinicia?**
   *Ticket Manager cuenta con lecturas de alta velocidad sobre MariaDB desacopladas y un mecanismo de sincronización idempotente con reintentos controlados y estados de fallback.*
2. **¿Se pueden crear tickets directamente desde la interfaz de Ticket Manager?**
   *No por diseño normativo. Toda creación de tickets se centraliza en GLPI para preservar el motor de reglas de negocio, asignación automática de categorías, acuerdos de nivel de servicio (SLA) y notificaciones corporativas por correo.*
3. **¿Cómo garantizamos que nadie borre ni salte tareas técnicas?**
   *La nueva regla de resolución validada a nivel de API exige que todas las tareas planificadas pasen a estado 'Realizada' antes de admitir el cierre, protegiendo la veracidad de los reportes y métricas de soporte.*
