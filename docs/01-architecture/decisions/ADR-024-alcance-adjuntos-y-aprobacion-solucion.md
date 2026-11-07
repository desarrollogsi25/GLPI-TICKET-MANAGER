# ADR-024 — Alcance arquitectónico para adjuntos y ciclo de aprobación/rechazo de soluciones

> **Control Documental ISO 9001 / ISO 27001 / ISO 20000-1**
> **Código:** DOC-01-ADR-024 | **Versión:** 1.0.0 | **Fecha:** 2026-11-07 | **Autor:** GLPI Ticket Manager Team

## Estado
Accepted

## Contexto (QA-16)
Durante la auditoría integral y pruebas de aceptación de GLPI Ticket Manager, se evaluaron dos capacidades clave del ciclo de vida de tickets que requieren una definición arquitectónica explícita para delimitar el alcance actual frente a futuras expansiones:
1. **Gestión y subida de archivos adjuntos (Document / ITILDocument):** Intercambio de capturas, logs y documentos adjuntos entre técnicos y solicitantes.
2. **Ciclo de aprobación o rechazo de soluciones por el solicitante (Solution Approval / Validation):** En GLPI nativo, una solución aportada por el soporte puede pasar por un periodo de validación donde el usuario final la aprueba (cerrando el ticket definitivamente) o la rechaza (reabriendo el ticket a asignado con comentarios).

## Decisión

### 1. Alcance de Archivos Adjuntos (Documentos)

- **Fase Actual (v1.0):**
  - **Visualización y Enlaces Seguros:** Los tickets que contienen descripciones o seguimientos con enlaces a documentos preexistentes en GLPI se representan como texto enriquecido seguro y sanitizado (evitando inyecciones XSS y parseando tags HTML nativos de GLPI a vistas limpias).
  - **Desacoplamiento de Binarios:** No se almacena ningún archivo binario en la base de datos propia (PostgreSQL). Todo archivo persistido reside exclusivamente en el almacenamiento gestionado por GLPI (`/var/lib/glpi/files/_documents/`).
- **Diseño para la Fase Siguiente (v1.1 - Hoja de Ruta):**
  - **Contrato de API Propuesto:**
    - `POST /api/tickets/{id}/documents` (multipart/form-data)
    - Límites de seguridad: Tamaño máximo de 10 MB, lista blanca de extensiones (`.png`, `.jpg`, `.pdf`, `.txt`, `.docx`, `.xlsx`, `.zip`), validación de magic bytes (MIME type sniffing) y sanitización de nombres de archivo.
  - **Integración con GLPI REST:**
    - Se ejecutará invocando `POST /Document` con `uploadManifest` y subida multipart oficial de la API de GLPI, seguida por la vinculación en `POST /Document_Item` asociando el documento al `Ticket` correspondiente (`itemtype: "Ticket", items_id: ticketId`).
  - **Permisos:** Solicitante solo puede adjuntar en sus propios tickets; técnico solo en tickets de sus grupos autorizados.

### 2. Aprobación y Rechazo de Soluciones por el Solicitante

- **Fase Actual (v1.0):**
  - **Autoridad de GLPI:** La inserción de una solución por parte de un técnico autenticado (`POST /api/tickets/{id}/solutions` o `POST /api/tickets/{id}/resolve`) requiere obligatoriamente que todas las tareas del ticket estén completadas (`done > 0` y `open == 0`), y que el ticket no esté en espera.
  - **Reapertura de Soluciones Insuficientes:** Si un solicitante no está conforme con la solución brindada, el flujo operativo estándar de la v1.0 permite que el usuario se comunique vía seguimiento o que el equipo de soporte invoque `POST /api/tickets/{id}/reopen` (ADR-019), lo que invalida la solución previa para nuevos cómputos y reactiva el ticket en estado Asignado (2).
- **Diseño para la Fase Siguiente (v1.1 - Hoja de Ruta):**
  - **Contrato de API Propuesto:**
    - `POST /api/tickets/{id}/solutions/{solutionId}/approve`: Marca la solución como aprobada en `glpi_itilsolutions` (`status = 3 Accepted`), transicionando el ticket directamente a estado Cerrado (6).
    - `POST /api/tickets/{id}/solutions/{solutionId}/refuse`: Marca la solución como rechazada (`status = 4 Refused`), añade el comentario obligatorio del solicitante como `ITILFollowup` público, y transiciona el ticket automáticamente a estado Asignado (2) para que el técnico continúe la atención.
  - **Regla de Negocio:** Solo el solicitante autenticado o un administrador pueden emitir aprobación/rechazo sobre la solución activa.

## Consecuencias
- **Seguridad:** Previene la exposición prematura de endpoints multipart sin escaneo antivirus en entornos corporativos LAN/WAN.
- **Claridad de Alcance:** Establece una demarcación inequívoca entre los 22 hallazgos de corrección inmediata de la versión 1.0 y las características evolutivas de la versión 1.1.
