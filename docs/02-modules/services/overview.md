# Catálogo de Servicios (Services Module)

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

## 4. Alcance y Extensiones Futuras

- **Incluido en Bloque 7a:** Endpoint `GET /api/services`, página `/services`, seeding de fixtures y test E2E.
- **Fuera de alcance:** Filtrado de tickets por categoría/servicio en Kanban y tabla de tickets (planificado para el Bloque 7c).
