# Plantilla de Informe Post-Mortem de Incidentes

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-11-INC-POSTMORTEM-TPL | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Resumen Ejecutivo
- **ID del Incidente:** INC-YYYYMMDD-XX
- **Fecha y Hora de Inicio (UTC):**
- **Fecha y Hora de Resolución (UTC):**
- **Duración Total:**
- **Severidad:** (P1 / P2 / P3)
- **Servicios Afectados:**
- **Lead del Incidente:**

## 2. Impacto en el Negocio y Usuarios
- Número estimado de usuarios impactados:
- Operaciones bloqueadas (lectura, escritura, autenticación):
- Pérdida o inconsistencia de datos: (Sí/No - detallar si aplica)

## 3. Cronología de Eventos (Timeline)
| Timestamp (UTC) | Evento / Acción Tomada | Responsable |
| :--- | :--- | :--- |
| HH:MM | Se dispara alerta de monitoreo... | Sistema |
| HH:MM | Confirmación y clasificación del incidente... | Guardián técnico |
| HH:MM | Aplicación de medida de contención... | DevOps |
| HH:MM | Mitigación desplegada y validación de servicio... | Equipo |

## 4. Análisis de Causa Raíz (5 Porqués / RCA)
1. **¿Por qué ocurrió la degradación?**
2. **¿Por qué falló el mecanismo preventivo?**
3. **¿Por qué no se detectó en etapas tempranas (testing/staging)?**
4. **¿Por qué demoró la contención?**
5. **Causa Raíz Definitiva:**

## 5. Acciones Correctivas y Preventivas (CAPA)
| Acción | Responsable | Fecha Límite | Ticket / PR |
| :--- | :--- | :--- | :--- |
| Implementar test de regresión automatizado... | Backend Lead | YYYY-MM-DD | #XX |
| Mejorar métricas y alertas en Prometheus... | SRE Lead | YYYY-MM-DD | #XX |
| Actualizar documentación operativa... | Tech Writer | YYYY-MM-DD | #XX |
