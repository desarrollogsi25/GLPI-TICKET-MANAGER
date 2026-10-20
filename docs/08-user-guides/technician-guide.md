# Guía de Usuario: Técnico de Mesa de Ayuda

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-08-UG-TECHNICIAN | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Introducción

Esta guía describe el funcionamiento operativo diario para los técnicos de soporte en la **Consola de Service Desk** de GLPI Ticket Manager. El software es una Consola exclusiva para Técnicos y Administradores; los usuarios finales crean sus requerimientos directamente en la interfaz nativa de GLPI.

## 2. Acceso al Sistema

1. Ingrese a la URL de la aplicación desde su navegador (soporta escritorio y móviles).
2. Introduzca sus credenciales de GLPI (usuario y contraseña).
3. Tras iniciar sesión, será redirigido al panel principal con la vista de sus tickets asignados y la cola de su grupo de atención.

## 3. Flujo Operativo en el Tablero Kanban

### 3.1. Reclamar un Ticket de la Cola (`Claim`)
- En la columna **Cola del grupo**, visualice las incidencias pendientes de asignación pertenecientes a su grupo de trabajo.
- **En Escritorio**: Arrastre la tarjeta desde "Cola del grupo" hacia "Mis tickets", o pulse el botón `[Asignarme]`.
- **En Móvil**: Seleccione la pestaña "Cola" y pulse `[Asignarme]`.
- El ticket se asignará exclusivamente a su usuario y pasará de inmediato a su columna personal.

### 3.2. Iniciar Trabajo en una Incidencia
- Desde la columna **Mis tickets**, pulse `[Empezar]` o arrastre la tarjeta a **En progreso**.
- El estado en GLPI cambiará a "Planificado" (3).

### 3.3. Pausar y Retomar
- Si requiere esperar insumos de un tercero, mueva la tarjeta a **Pendiente**.
- Para reanudar el trabajo, mueva la tarjeta a **En progreso** o pulse `[Retomar]`.

### 3.4. Resolver la Incidencia
- Cuando la incidencia esté solucionada, pulse `[Resolver]` o arrastre a **Resuelto**.
- Se desplegará el diálogo mandatorio de solución:
  - Ingrese una descripción de la solución aplicada. Puede ser breve: para incidencias triviales basta con una respuesta corta como `OK` o `Listo`. Lo único obligatorio es que el campo **no quede vacío**.
  - Confirme la resolución. La solución quedará registrada en GLPI y el ticket pasará al estado "Resuelto" (5).

## 4. Consulta de Detalles y Seguimientos

- Haga clic en el número o título de cualquier tarjeta para abrir la vista detallada del ticket.
- Podrá consultar la descripción original, los datos de contacto del llamante y el historial de seguimientos públicos o privados según sus permisos.

## 5. Listado de Tickets y Filtros

La vista **Tickets** muestra, por defecto, únicamente los tickets asignados a su usuario. Como técnico, la vista se auto-scopea a su propia cola: el selector de "Técnico" **no aparece** (sólo lo ven supervisores y administradores para auditar el trabajo de otros). No es posible ver ni filtrar la cola de otro compañero desde esta pantalla.

Además de los filtros de **Estado** y **Prioridad**, dispone de un rango de fechas por fecha de creación:

- **Desde**: cota inferior del rango.
- **Hasta**: cota superior del rango. Un mismo día en ambos campos cubre el día completo.
- **Limpiar filtros** (escritorio) o **Limpiar todo** (móvil): restablece estado, prioridad, fechas y búsqueda de una sola vez.

> [!NOTE]
> Los filtros de fecha se aplican en **UTC**, que es como GLPI almacena la fecha de creación de los tickets. Si trabaja en una zona horaria distinta, un ticket creado cerca de la medianoche podría quedar en el rango del día contiguo en UTC.

Los filtros activos se reflejan en la URL (`?startDate=…&endDate=…`), por lo que puede compartir un enlace con el rango exacto que está consultando.

- En **escritorio**, los campos "Desde"/"Hasta" aparecen en la misma fila que Estado y Prioridad.
- En **móvil**, ábralos desde el botón **Filtros** (bottom sheet) y confírmelos con **Aplicar filtros**. El badge del botón indica cuántos filtros están activos.
