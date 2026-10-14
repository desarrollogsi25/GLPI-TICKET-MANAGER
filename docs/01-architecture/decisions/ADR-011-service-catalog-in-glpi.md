# ADR-011: Catálogo de servicios basado en categorías ITIL nativas de GLPI

- **Status:** Accepted
- **Date:** 2026-10-14
- **Related:** ADR-009, ADR-010, ADR-012

## Contexto

El negocio estructura sus servicios y solicitudes bajo un catálogo de servicios jerárquico (por ejemplo: "Requerimiento", "Aplicaciones", "Infraestructura", "Sistemas", etc.).

Se evaluó dónde debe residir y administrarse dicho catálogo:
1. En GLPI mediante su funcionalidad nativa de categorías ITIL (`glpi_itilcategories`).
2. En una tabla personalizada dentro de la base de datos PostgreSQL propia.
3. Mediante un plugin personalizado desarrollado para GLPI.

GLPI cuenta de forma nativa con un árbol de categorías ITIL (`glpi_itilcategories`) que soporta recursión jerárquica (`itilcategories_id` como padre), ancestros completados (`completename`), visibilidad por entidad y asignación por defecto a grupos o técnicos.

## Decisión

1. **Fuente de verdad única en GLPI**:
   El catálogo de servicios residirá exclusivamente en la tabla nativa `glpi_itilcategories` de MariaDB.
2. **Administración en GLPI**:
   Los administradores de GLPI gestionan el árbol de categorías directamente desde la interfaz administrativa de GLPI (`Configuración > Títulos > Categorías de los casos`). No se requiere ningún plugin custom.
3. **Consumo de solo lectura en el sistema propio**:
   El sistema propio únicamente **lee** este catálogo para proveer capacidades avanzadas de filtrado, agrupación de tickets en colas y métricas operativas.
4. **Nuevo endpoint de lectura**:
   Se expondrá el endpoint `GET /api/services` (o `GET /api/categories`) en la API .NET 9, el cual consultará `glpi_itilcategories` directamente en MariaDB vía Dapper para retornar la estructura en árbol o lista aplanada.

## Alternativas rechazadas

- **Tabla propia de catálogo en PostgreSQL**: Rechazada. Obligaría a mantener sincronización bidireccional continua con GLPI, duplicando datos y arriesgando inconsistencias cuando los usuarios clasifiquen tickets en GLPI.
- **Desarrollo de plugin custom en GLPI**: Rechazada. La funcionalidad nativa de `glpi_itilcategories` cubre el 100% de la jerarquía requerida. Un plugin añade complejidad de despliegue y deuda técnica en actualizaciones de versión (GLPI 11).

## Consecuencias

- **Positivas**:
  - Aprovechamiento total de las jerarquías nativas (`completename`, árbol padre-hijo) ya configuradas en GLPI.
  - Cero esfuerzo de mantenimiento administrativo en el sistema propio para altas, bajas o modificaciones de servicios.
  - Implementación simple y eficiente en la API .NET mediante consultas SQL optimizadas con Dapper.
- **Negativas / Compromisos**:
  - Toda reorganización del catálogo de servicios debe ser ejecutada por administradores en la consola de GLPI.
