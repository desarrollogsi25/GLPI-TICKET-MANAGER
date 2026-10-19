# Registro y Matriz de Mitigación de Vulnerabilidades (Auditoría H-01 a H-25)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-12-SEC-VULNERABILITIES | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Alcance y Contexto de Seguridad

Este documento consolida el inventario de vulnerabilidades y hallazgos de seguridad analizados y mitigados en GLPI Ticket Manager, dando cumplimiento a los requisitos de ISO 27001 (A.12.6 Gestión de vulnerabilidades técnicas y A.14 Seguridad en el desarrollo de software).

## 2. Matriz de Hallazgos y Estado de Mitigación

| ID | Categoría | Descripción del Riesgo | Severidad | Estado | Mecanismo de Mitigación Implementado |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **H-01** | Autenticación | Exposición de credenciales en endpoints no seguros | Alta | **Mitigado** | Tokens JWT HMAC-SHA256 y canal HTTPS mandatorio. |
| **H-02** | Autorización | IDOR en acceso a tickets de otros grupos | Alta | **Mitigado** | Verificación estricta en `TicketAccessPolicy` contra grupos del usuario. |
| **H-03** | Criptografía | Algoritmos débiles en hashing de contraseñas | Alta | **Mitigado** | Delegación de credenciales a motor seguro nativo de GLPI. |
| **H-04** | Inyección SQL | Concatenación dinámica en queries complejas | Crítica | **Mitigado** | Parametrización total con Dapper y Entity Framework Core. |
| **H-05** | Rate Limiting | Ataques de denegación de servicio por fuerza bruta | Media | **Mitigado** | Rate limiting por IP y por usuario en `/api/auth/login` y endpoints críticos. |
| **H-06** | CORS | Políticas permisivas `*` en cabeceras de origen | Media | **Mitigado** | Whitelist explícita de orígenes permitidos según ambiente. |
| **H-07** | Secretos | Credenciales hardcodeadas en repositorios Git | Crítica | **Mitigado** | Escaneo preventivo en CI con Gitleaks y variables inyectadas por entorno. |
| **H-08** | Confidencialidad | Seguimientos privados expuestos a roles externos | Alta | **Mitigado** | Filtro estricto en API: notas privadas invisibles para solicitantes/observadores. |
| **H-09** | Concurrencia | Race condition en toma simultánea de incidencias | Media | **Mitigado** | Reclamo atómico con manejo de error HTTP 409 Conflict. |
| **H-10** | Cabeceras HTTP | Falta de headers de seguridad estándar | Baja | **Mitigado** | Inclusión de `X-Content-Type-Options`, `X-Frame-Options` y CSP. |
| **H-18** | Documentación | Inconsistencia de estructura y control documental | Media | **Mitigado** | Estandarización de `docs/` con encabezados ISO 9001 / ISO 27001. |
| **H-24** | Validación | Soluciones de tickets vacías o con espacios en blanco | Media | **Mitigado** | Validación explícita de longitud mínima en backend y rechazo 400. |
| **H-25** | Integridad | Registros marcados como eliminados (`is_deleted=1`) visibles | Media | **Mitigado** | Cláusula `is_deleted = 0` mandatoria en todas las consultas SQL. |

## 3. Protocolo de Escaneo Continuo

1. **Análisis de Secretos:** Ejecución obligatoria de `gitleaks detect --redact` en cada pull request.
2. **Dependencias:** Auditoría de vulnerabilidades con `dotnet list package --vulnerable` y `pnpm audit`.
3. **Pruebas de Seguridad en Integración:** Verificación automatizada de políticas de acceso y privacidad mediante xUnit en CI (`FollowupPrivacyTests`, `ConcurrencyTests`).
