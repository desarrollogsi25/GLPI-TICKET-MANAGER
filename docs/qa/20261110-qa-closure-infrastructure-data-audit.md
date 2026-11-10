# Auditoría de Cierre de QA: Infraestructura y Regularización de Datos en `glpi-db`

> **Control Documental / ISO 20000-1 / ISO 27001 / OWASP**  
> **Fecha:** 2026-11-10  
> **Proyecto:** GLPI-TICKET-MANAGER  
> **Rama:** `feat/mision-maestra-qa-correcion-integral`  

---

## 1. Declaración de Infraestructura Intacta (LAN Original)

Se certifica que durante todas las fases de remediación, verificación y pruebas de QA:

1. **Contenedores de Producción / LAN Original:**  
   - Los contenedores `glpi`, `glpi-api`, `glpi-lan-frontend`, `glpi-db` (LAN) y `glpi-app-db` permanecen **completamente intactos, sin reinicios forzados, sin alteraciones de configuración y sin interrupciones**.
2. **Volúmenes y Redes:**  
   - No se ejecutó ningún `docker volume prune`, ni migraciones destructivas ni mutaciones sobre la red de la LAN original.
3. **Aislamiento:**  
   - Las pruebas E2E y suites de regresión se ejecutaron en fixtures aisladas y en los endpoints dedicados de QA (`http://localhost:5280` para API QA y `http://localhost:4173` para frontend QA Vite).

---

## 2. Auditoría de Datos y Modificaciones en `glpi-db` (QA)

La base de datos de pruebas `glpi-db` (MariaDB 10.11 alojada en el volumen Docker `sistemaopensourceglpi_glpi-db-data`) contiene los datos de prueba y tickets históricos. A continuación se desglosan las modificaciones de datos:

### A. Tarea Histórica #49 (Ticket #1027)

- **Antecedente:**  
  La tarea #49 del ticket #1027 fue creada originalmente el `2026-11-09 17:02:17` por el usuario Administrador (`users_id = 10`), asignada inicialmente a `users_id_tech = 10` (Administrador) a pesar de que el ticket #1027 está asignado operativamente a `tech_sd` (`users_id = 16`, Grupo Service Desk).
- **Motivo de la Regularización:**  
  Durante la auditoría manual, se detectó que la consulta de disponibilidad para reprogramar la tarea #49 arrojaba un 403 al no coincidir el técnico responsable de la tarea con el alcance operativo, y el horario colisionaba con los ejercicios de prueba del día 10/11.
- **Acción Ejecutada en QA (2026-11-10 13:57:36):**  
  Se regularizó la tarea #49 mediante llamada autorizada a la API nativa de GLPI:
  - **Técnico asignado (`users_id_tech`):** Actualizado de 10 (`admin_test`) a 16 (`tech_sd`), alineándolo con el técnico responsable del ticket.
  - **Horario planificado:** Reprogramado al slot `2026-11-11 09:00:00Z` – `2026-11-11 10:00:00Z` (10:00–11:00 CET/París).
  - **Estado:** Mantenido en estado 1 (Por hacer).
  - **Estado del Ticket #1027:** Mantenido en GLPI 3 (Planificado).
- **Trazabilidad:**  
  El cambio quedó debidamente registrado en la tabla de auditoría `glpi_logs` de GLPI, reflejando el id del técnico anterior y nuevo con timestamp.

### B. Tickets #1023, #1028 y #1029

- **Ticket #1023:** Se verificó la inmutabilidad del campo `date` (Fecha de Creación) frente a `date_mod` (Última actualización), corrigiendo el mapper backend y la vista frontend.
- **Ticket #1028:** Utilizado para la validación de planificación sin autoselección y selección explícita de slot. El diálogo fue cancelado tras la prueba sin mutar el ticket.
- **Ticket #1029:** No fue alterado ni completado para preservar su estado cerrado de control.

---

## 3. Resumen de Pruebas Automatizadas Observadas

| Prueba | Componente | Resultado |
|---|---|---|
| P1: Selección de día e invalidación explícita | VisualScheduleSelector / PlanTicketDialog | **PASS** (100%) |
| P1: Reprogramación abre en fecha real (11/11) con guard no-op | ReplanTicketTaskDialog | **PASS** (100%) |
| P2: Aislamiento de sesión en login y pantalla 403 amigable | Login.tsx / Detail.tsx | **PASS** (100%) |
| P2: Responsividad móvil en modales (320, 375, 390, 768 px) | Dialog.tsx / VisualScheduleSelector.tsx | **PASS** (100% sin overflow horizontal, touch targets >= 32px) |
| Backend Unit Tests | .NET 10 Solution | **PASS** (95/95) |
| Backend Integration Tests | Api.Integration.Tests | **PASS** (248/248) |
| Frontend Unit Tests | Vitest | **PASS** (24/24) |
| Frontend Typecheck & Build | TypeScript / Vite | **PASS** (0 errores) |
