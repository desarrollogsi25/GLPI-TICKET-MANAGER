# Catálogo de Servicios (Services Module)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-02-MOD-SERVICES | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


- **Capa:** `GlpiTicketManager.Application` + `GlpiTicketManager.Infrastructure` + `frontend`
- **Origen de datos:** Tabla `glpi_itilcategories` en MariaDB (ADR-011)
- **Repositorio:** `IServiceRepository` (`GlpiTicketManager.Infrastructure.Repositories.ServiceRepository`)
- **Acceso:** Solo lectura (`GET /api/services`). La creación y edición de categorías se gestiona en la interfaz nativa de GLPI.

---

## 1. Propósito

Proveer al frontend de una vista estructurada del catálogo de categorías ITIL de GLPI para permitir a los usuarios visualizar los servicios ofrecidos y su clasificación jerárquica.

---

## 2. Modelo de Datos y Contrato API

El backend devuelve una lista **aplanada** de categorías (`ServiceDto`) para minimizar la complejidad del mapping en el servidor y permitir flexibilidad de renderizado en el cliente:

```json
[
  {
    "id": 2,
    "name": "Requerimiento",
    "parentId": null,
    "completeName": "Requerimiento",
    "level": 1
  },
  {
    "id": 3,
    "name": "Acceso a sistema",
    "parentId": 2,
    "completeName": "Requerimiento > Acceso a sistema",
    "level": 2
  }
]
```

### Conversión de Raíces
En GLPI, las categorías sin padre tienen `itilcategories_id = 0`. La consulta SQL utiliza `NULLIF(itilcategories_id, 0) AS ParentId` para mapear limpiamente el identificador a un tipo anulable (`int?`) en .NET y `number | null` en TypeScript.

---

## 3. Construcción del Árbol en el Frontend

La página `/services` (`ServicesPage.tsx`):
1. Consume `GET /api/services` mediante el hook `useServicesQuery` (`@tanstack/react-query`).
2. Transforma la lista aplanada en una estructura jerárquica de árbol en memoria vinculando `node.children` con `item.parentId`.
3. Renderiza componentes plegables/desplegables con chevron, expandidos por defecto.
4. Muestra contadores de subservicios e indicadores de nivel ITIL.

---

## 4. Uso en filtrado de tickets

- Cada nodo del catálogo de servicios en `/services` incluye un botón "Ver tickets".
- Al hacer clic en un servicio, se navega a `/tickets?serviceId={id}`.
- La vista de tickets lee el query param `serviceId`, muestra un chip de filtro activo con opción de removerlo, y consulta `GET /api/tickets?serviceId={id}`.
- El backend resuelve el filtrado considerando el ID de la categoría y sus hijos directos (1 nivel de profundidad).
- En nodos hoja se filtran los tickets de esa categoría específica; en nodos padre se incluyen los tickets del padre y de sus subcategorías inmediatas.

---

## 5. Alcance

- **Bloque 7a:** Endpoint `GET /api/services`, página `/services`, seeding de fixtures y test E2E.
- **Bloque 7c:** Filtro de tickets por servicio (`serviceId`) en backend y enlace desde `/services` hacia `/tickets` con chip de filtro activo.
- **Fuera de alcance:** Filtrado de tickets en Kanban (reservado para Bloque 8).

