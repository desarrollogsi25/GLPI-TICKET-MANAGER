# Guía de Usuario — GLPI Ticket Manager

> **GLPI Ticket Manager — Consola Web de Mesa de Ayuda (Service Desk)**  
> **Versión:** 1.0.0 | **Audiencia:** Técnicos, Supervisores y Solicitantes | **Fecha:** Octubre 2026

Bienvenido al manual rápido de **GLPI Ticket Manager**. Esta consola web moderna permite a los equipos de soporte y desarrollo gestionar, resolver y supervisar tickets de GLPI 11 de forma ágil, con sincronización en tiempo real y flujo Kanban.

---

## 1. Cómo Crear un Ticket en GLPI

Existen dos vías para reportar una incidencia o solicitud:

### Opción A — Desde la Interfaz de Usuario de GLPI 11
1. Acceda al portal de autoservicio de GLPI en `http://localhost:8081` (o la URL designada en su red).
2. Inicie sesión con su usuario y contraseña (ej. `user_test` / `Password123!`).
3. En la página de bienvenida, haga clic en el catálogo visual de servicios o en el botón **Reportar un problema** / **Solicitar un servicio**.
4. Complete los campos requeridos:
   - **Título**: Resumen descriptivo del problema.
   - **Descripción**: Detalle de la incidencia.
   - **Categoría**: Seleccione la categoría adecuada (ej. *Hardware*, *Software*, *Aplicaciones GSI*, *Requerimiento BI*).
5. Haga clic en **Enviar**.
6. **Enrutamiento automático:** Las reglas de negocio de GLPI clasificarán y asignarán el ticket automáticamente al grupo técnico correspondiente (*Desarrollo*, *BI* o *Service Desk*). El webhook integrado notificará instantáneamente a los técnicos asignados en la app.

### Opción B — Mediante la API REST del Sistema
Los sistemas externos o formularios integrados pueden emitir un `POST /api/tickets` enviando:
```json
{
  "title": "Fallo en monitor de recepción",
  "description": "El monitor parpadea y se apaga tras 5 minutos de uso.",
  "urgency": 3,
  "categoryId": 16
}
```

---

## 2. Cómo Asignarse un Ticket en la App

Cuando un ticket nuevo ingresa a su grupo, aparecerá en la **Cola del Grupo**:

1. Inicie sesión en la App Web (`http://localhost:5173`) con su cuenta técnica (ej. `tech_dev`, `tech_bi` o `tech_sd`).
2. En el menú lateral izquierdo, diríjase a **Cola** (`/queue`).
3. Verá la lista de tickets pendientes de asignación pertenecientes a su grupo de trabajo.
4. En la tarjeta del ticket deseado, haga clic en el botón azul **Asignarme**.
5. **Resultado:**
   - El sistema vinculará su usuario como técnico responsable en GLPI.
   - El ticket saldrá de la cola de espera y se incorporará automáticamente a su tablero personal **Kanban**.
   - Los demás técnicos verán desaparecer el ticket de su cola en tiempo real gracias a SignalR.

---

## 3. El Flujo de Estados del Ticket

El ciclo de vida operativo de un ticket en GLPI Ticket Manager sigue un flujo estricto y seguro:

```text
┌─────────────────┐       Autoasignación      ┌─────────────────┐
│     NUEVO       │ ────────────────────────> │   EN PROGRESO   │
│ (En cola grupo) │                           │  (Status: 2/3)  │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                        Pausar ticket  │  ▲ Reanudar trabajo
                                        (con motivo)   │  │
                                                       ▼  │
                                              ┌─────────────────┐
                                              │    PENDIENTE    │
                                              │   (Status: 4)   │
                                              └────────┬────────┘
                                                       │
                                     Escribir solución │
                                                       ▼
                                              ┌─────────────────┐
                                              │    RESUELTO     │
                                              │   (Status: 5)   │
                                              └─────────────────┘
```

### 3.1 En Progreso / Planificado (Status 2 / 3)
- Es el estado activo de trabajo.
- Puede arrastrar la tarjeta en el tablero **Kanban** entre columnas para reflejar el avance.
- Puede ingresar al detalle del ticket (`/tickets/:id`) para consultar la descripción, solicitante, categoría y seguimientos.

### 3.2 Pendiente / En Espera (Status 4)
- **¿Cuándo usarlo?** Cuando el avance del ticket está bloqueado a la espera de información del solicitante, repuestos de un proveedor o validación externa.
- **Cómo aplicarlo:**
  1. En el detalle del ticket, haga clic en el botón **Poner en Pendiente**.
  2. Seleccione el **Motivo** (ej. *Esperando respuesta del usuario*, *Pieza en tránsito*).
  3. Escriba un **Comentario explicativo**.
  4. Haga clic en **Confirmar**.
- **Seguridad y Trazabilidad:** El comentario se registra de forma transparente en el historial de GLPI (`glpi_itilfollowups`) como seguimiento privado.

### 3.3 Resuelto (Status 5)
- **¿Cuándo usarlo?** Cuando el requerimiento o incidente fue subsanado satisfactoriamente.
- **Regla Obligatoria:** No es posible resolver un ticket sin redactar una **Solución escrita**.
- **Cómo resolver:**
  1. Arrastre la tarjeta a la columna *Resuelto* en el Kanban o haga clic en **Resolver Ticket** en la pantalla de detalle.
  2. En el modal emergente, redacte la solución aplicada (ej. *"Se sustituyó el cable HDMI defectuoso y se verificó funcionamiento correcto durante 30 minutos"*).
  3. Haga clic en **Resolver**.
  4. El ticket se moverá a *Resuelto* y GLPI notificará al solicitante.

### 3.4 Reapertura (Para Supervisores y Administradores)
- Si el solicitante no está satisfecho con la solución, un Administrador o Supervisor puede hacer clic en **Reabrir Ticket**, especificando el motivo de reapertura. El ticket volverá inmediatamente a *En Progreso*.

---

## 4. Para Qué Sirve el Command Palette (`Ctrl + K`)

El **Command Palette** es un centro de comandos rápido pensado para agilizar el flujo de trabajo de técnicos y líderes sin apartar las manos del teclado:

- **Atajo de teclado:** Presione `Ctrl + K` (en Windows/Linux) o `Cmd + K` (en macOS) en cualquier pantalla de la app.
- **También accesible:** Desde el botón de búsqueda en la cabecera superior.

### Principales Acciones Disponibles:
1. **Navegación Instantánea:**
   - Escriba `kanban`, `cola`, `tickets`, `servicios`, `dashboard`, `preferencias` o `ayuda` para saltar a cualquier módulo sin hacer clics.
2. **Cambio Rápido de Tema:**
   - Escriba `tema` u `oscuro` para alternar entre el **Modo Claro** y el **Modo Oscuro** inmediatamente.
3. **Atajo de Cierre:**
   - Presione la tecla `Escape` para cerrar la paleta y regresar al punto exacto donde estaba trabajando.

---

## 5. Notificaciones en Tiempo Real y Soporte Móvil

- **Campana de Notificaciones:** En la barra superior verá el contador de notificaciones pendientes. Al hacer clic se despliega el historial de asignaciones, comentarios y soluciones recientes.
- **Uso en Dispositivos Móviles:** La aplicación está optimizada para smartphones y tablets:
  * El menú lateral se transforma en un **Cajón Deslizante (Drawer)** accesible desde el icono de hamburguesa.
  * Los filtros de tickets se abren en un **Panel Inferior (Bottom Sheet)** fácil de usar con una sola mano.
  * Todas las tarjetas y botones cumplen con los estándares de accesibilidad táctil (&ge; 44px de área de pulsación).
