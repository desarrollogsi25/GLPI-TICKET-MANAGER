---
name: archify
description: Genera, valida y compila diagramas de arquitectura interactivos en HTML autónomo con SVG vectorial, modo claro/oscuro y búsqueda de nodos (motor Archify). Usar para documentar visualmente la arquitectura del sistema, topologías de red, flujos de datos o secuencias de llamadas.
---

# Archify — Interactive Architecture Engine Skill

Especialista en compilación de especificaciones declarativas JSON-IR en diagramas HTML interactivos autónomos (cero dependencias externas, compilación ultra-rápida en ~265 ms).

## Cuándo invocar
- Al diseñar o actualizar el mapa de arquitectura de servicios o microservicios.
- Para documentar visualmente flujos de llamadas o secuencias HTTP/WebSockets.
- Para generar entregables visuales interactivos para READMEs o auditorías.

## Rutas e Invocación del Motor Archify
* **Invocación recomendada (On-demand / Global):** `pnpm dlx archify@latest` o `npx archify@latest`
* **Binario local (si está clonado):** `node tools/archify/bin/archify.mjs`

## Procedimiento de Compilación

1. **Diseñar o Actualizar la Especificación JSON-IR (`*.architecture.json`):**
   - Declarar componentes con `id`, `type` (external, frontend, service, database, broker), `label`, `pos`, `size`.
   - Declarar conexiones tipadas con `from`, `to`, `label`, `protocol`.
   - Declarar boundaries y vistas enfocadas (`views`).

2. **Validar la Especificación:**
   ```powershell
   npx -y archify@latest validate architecture <archivo.json> --quality showcase --json
   ```

3. **Compilar a HTML Autónomo:**
   ```powershell
   npx -y archify@latest deliver architecture <archivo.json> <salida.html> --quality showcase --json
   ```

4. **Handover CAHP:**
   ```
   [CAMBIÓ]: <ruta del archivo .architecture.json y .architecture.html>
   [AFECTA]: <documentación visual del sistema>
   [RIESGO]: bajo
   [SIGUIENTE]: @tech-lead
   ```
