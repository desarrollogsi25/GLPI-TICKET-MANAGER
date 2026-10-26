# 📦 Release: Ecosistema Multi-Agente Antigravity IDE (v2 Core)

Este paquete contiene la distribución completa, limpia y portable del ecosistema de agentes **Antigravity IDE v2 Core** (con arquitectura **DAG Concurrente de 4 Fases**, suite de **Cloudflare Security**, **GitNexus MCP** y puente **Archify**).

---

## 🚀 ¿Cómo usar este paquete en otra PC?

1. **Copia esta carpeta `release_v2`** (o comprímela en un archivo `.zip`) a cualquier otra computadora.
2. En la otra computadora, abre la carpeta `release_v2`.
3. Tienes **dos formas** sencillas de ejecutar el inicializador:

### Opción A: Doble Clic (Modo Fácil / Windows)
Haz doble clic sobre el archivo:
```cmd
init-project.cmd
```
Se abrirá automáticamente el asistente interactivo:
1. Te preguntará la **ruta base** donde guardas tus proyectos (por ejemplo `C:\Proyectos` o `D:\Desarrollo`).
2. Te preguntará el **nombre de la carpeta** para el nuevo proyecto (por ejemplo `mi-app-web` o `sistema-tickets`).
3. **Si la carpeta no existe, el script la creará automáticamente.**
4. Instalará las 11 skills, las 5 reglas maestras y la configuración lista para Antigravity IDE v2.

### Opción B: Desde PowerShell / Terminal
Abre PowerShell dentro de la carpeta `release_v2` y ejecuta:

```powershell
# Modo interactivo con menú guiado:
.\init-project.ps1

# O indicando la ruta directa de una vez:
.\init-project.ps1 -BasePath "D:\MisProyectos" -ProjectName "mi-nueva-app"

# O si deseas instalar los agentes de forma global en esa PC:
.\init-project.ps1 -Global
```

---

## 🛠️ Contenido del Build v2 (`template/`)

### 1. Skills Especialistas (`.agents/skills/` — 11 Skills):
* **`@tech-lead`:** Orquestador principal del pipeline DAG concurrente de 4 fases.
* **`@arch`:** Clean Architecture, Domain Driven Design, contratos tipados y DTOs congelados.
* **`@sec` & `@security-audit`:** Framework de auditoría de 6 fases de Cloudflare, validador autónomo de `findings.json` adaptado para Windows y guías de ataque CWE.
* **`@db-master`:** Persistencia, pooling, migraciones e indexación relacional/vectorial.
* **`@api-core`:** Endpoints RESTful, Minimal APIs, middlewares y resiliencia.
* **`@ui-expert`:** Frontend moderno, micro-animaciones, componentes accesibles y diseño visual.
* **`@gitnexus`:** Grafo AST y análisis de radio de impacto previo a edición de código.
* **`@archify`:** Compilación de documentación visual vectorial interactiva HTML.
* **`@caio`:** Protocolo canónico CAHP y gobernanza de traspasos multi-agente.
* **`@eval-harness`:** Batería de pruebas automatizadas de activación.

### 2. Reglas Normativas Maestras (`.agents/rules/` — 5 Reglas):
* Reducción del **51.9% de sobrecarga fija de tokens** con reglas destiladas para APIs, Arquitectura, Base de Datos, Frontend y Seguridad.

### 3. Herramientas y Plugins:
* **Plugin GitNexus MCP:** En `plugins/gitnexus/` (`mcp_config.json`).
* **Lifecycle Hooks:** En `hooks.json` (protección de blast radius antes de editar código).
* **Puente Universal:** `tools/bridge/sync-graph-to-archify.mjs` para sincronizar GitNexus con Archify.
* **Gobernanza:** `AGENTS.md` y `GEMINI.md` con el protocolo de traspaso CAHP.

---

## 🎯 Primeros Pasos tras Crear el Proyecto

1. Abre **Antigravity IDE**.
2. Ve a `File > Open Folder` y selecciona la carpeta recién creada.
3. En el chat, escribe:
   ```text
   @tech-lead Construye <tu requerimiento> usando el pipeline DAG
   ```
4. El IDE detectará automáticamente la carpeta `.agents`, registrará las 11 skills y activará el ecosistema v2.
