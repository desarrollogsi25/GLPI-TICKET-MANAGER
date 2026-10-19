# Procedimiento de Gestión de Incidentes

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-11-INC-MANAGEMENT | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Objetivo y Alcance

Definir el protocolo de respuesta ante incidentes técnicos que afecten la disponibilidad, confidencialidad o integridad de la plataforma GLPI Ticket Manager, conforme a los lineamientos de ISO 27001 (A.16 Gestión de incidentes de seguridad de la información) e ISO 9001 (Control de salidas no conformes).

## 2. Clasificación de Severidad

| Severidad | Descripción | SLA de Respuesta | SLA de Resolución | Escalado |
| :--- | :--- | :---: | :---: | :--- |
| **P1 - Crítico** | Caída total del backend o base de datos. Pérdida de integridad de tickets o brecha de seguridad. | < 15 min | < 2 horas | Lead Architect, CISO, DevOps Lead |
| **P2 - Alto** | Degeneración severa de rendimiento. Falla de SignalR o sincronización en tiempo real. | < 30 min | < 6 horas | Backend Senior, Frontend Senior |
| **P3 - Medio** | Funcionalidad específica no crítica fallando (ej. filtros de visualización o exportación). | < 2 horas | < 24 horas | Equipo de Desarrollo |
| **P4 - Bajo** | Errores menores visuales o cosméticos sin impacto funcional. | < 24 horas | Próximo sprint | Backlog de mantenimiento |

## 3. Fases del Flujo de Incidentes

```
[1. Detección] ──> [2. Clasificación] ──> [3. Contención] ──> [4. Erradicación] ──> [5. Recuperación] ──> [6. Post-Mortem]
```

### 3.1 Detección
- Notificaciones automáticas de alertas en Prometheus/Grafana.
- Errores HTTP 5xx consecutivos reportados en logs estructurados (Serilog).
- Reporte manual de supervisores o administradores.

### 3.2 Contención Inmediata
- Activación de balanceador o modo de contingencia si aplica.
- Aislamiento de sesiones en caso de sospecha de compromiso de credenciales.
- Aplicación de procedimientos de emergencia documentados en `docs/07-operations/emergency-procedure.md`.

### 3.3 Erradicación y Recuperación
- Despliegue de hotfix vía pipeline de CI/CD o rollback a la última versión estable mediante tags de Git.
- Verificación de integridad de base de datos antes de reabrir el tráfico público.

### 3.4 Análisis Post-Mortem
Todo incidente P1 o P2 requiere la redacción obligatoria de un informe Post-Mortem dentro de las 48 horas posteriores a la resolución, utilizando la plantilla `docs/11-incidents/post-mortem-template.md`.
