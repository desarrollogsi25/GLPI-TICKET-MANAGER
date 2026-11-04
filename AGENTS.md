AGENTS.md — GLPI Ticket Manager (Codex, modo individual)

Ámbito: todo el repositorio, salvo instrucciones más específicas en archivos AGENTS.md de subdirectorios. Propósito: permitir que Codex avance de forma autónoma y segura, sin depender de Antigravity, Qoder, OpenCode ni de sus tableros de coordinación. No sustituye políticas de seguridad o permisos de mayor prioridad.

1. Modo operativo y autoridad

Un único implementador: Codex. No crear subagentes, no delegar a otra IA y no exigir coop_status, claim_paths o un board.json heredado como parte de este procedimiento individual. Verificar antes de escribir que no existan otros procesos/agentes modificando los mismos archivos.

Los hooks y permisos siguen vigentes. Si safety-gate, una instrucción aplicable de mayor prioridad o una protección externa exige reservar una ruta y no funciona, no eludirla. Diagnosticar en lectura, proteger el trabajo y comunicar el bloqueo específico. Cambiar la política o reparar el mecanismo requiere la autorización correspondiente.

Decidir sin consultas innecesarias. Investigar y elegir la alternativa segura para decisiones técnicas rutinarias. Pedir autorización sólo para permisos faltantes, operaciones destructivas fuera de fixtures, gasto, cambios de política protegida, secretos, merges y despliegues.

Continuidad por fases. Tras completar y verificar una tarea, registrar evidencia y avanzar a la siguiente tarea autorizada. Si una acción está bloqueada, continuar trabajos independientes sin vulnerar controles.

2. Preservación del repositorio

Antes de editar: comprobar rama, HEAD, estado de Git, diff, archivos sin seguimiento relevantes, instrucciones aplicables y procesos concurrentes.

Todos los cambios preexistentes pertenecen al usuario o a trabajos anteriores. No descartarlos, sobrescribirlos ni incluirlos inadvertidamente en otro PR.

Prohibido git reset --hard, git clean, borrados amplios, rebase destructivo o sobrescritura de archivos desconocidos sin autorización específica.

Trabajar en rama o worktree aislado cuando exista conflicto. Un worktree no autoriza eludir hooks ni reglas de reservas aún vigentes.

Preservar AGENTS.md, .env, artefactos de agentes y archivos históricos. No publicar secretos ni copiar credenciales a logs, reportes, código o capturas.

3. GitNexus: análisis con degradación segura

Antes de cambiar símbolos centrales: preferir gitnexus.impact/context (MCP) o el CLI local instalado para identificar llamadores, consumidores, rutas y procesos afectados. Registrar el alcance y los riesgos.

Índice desactualizado: comprobar SHA/branch del índice. Si se puede actualizar de forma segura, usar la versión local conocida de GitNexus y la opción analyze --skip-agents-md --skip-skills para preservar las instrucciones y skills del repositorio. Examinar el diff antes y después. No ejecutar instalaciones dinámicas @latest por defecto.

GitNexus ausente, con errores o referencias UNKNOWN: realizar una revisión sustitutiva documentada: búsqueda dirigida con rg, definiciones, llamadores, contratos API, rutas, consumidores React, consultas SQL, tests y diff. Marcar el alcance como UNKNOWN o PARCIAL, nunca como riesgo bajo por falta de datos.

Un resultado HIGH/CRITICAL indica posible radio de impacto, no una vulnerabilidad demostrada. Comunicar los consumidores afectados, el riesgo específico, la mitigación y las pruebas de regresión necesarias; continuar sólo si la evidencia y los controles son suficientes.

Antes del commit: ejecutar gitnexus.detect_changes/CLI local si funciona; si no, documentar el fallback manual, revisar el diff completo y ejecutar los gates afectados. No bloquear indefinidamente una corrección menor únicamente porque el servicio del grafo esté caído; los cambios críticos de seguridad/datos exigen validación reforzada y las autorizaciones pertinentes.

Los comandos de GitNexus pueden generar o modificar archivos de contexto. Nunca permitir que una indexación sobrescriba reglas de gobernanza o agregue artefactos al commit sin revisión.

4. Reglas arquitectónicas de GLPI

Backend: .NET 10, API, Dapper, SignalR. Frontend: React/TypeScript. Datos GLPI: MariaDB; preferencias propias: PostgreSQL.

Dapper sólo para lecturas autorizadas de GLPI. Mutaciones del dominio GLPI mediante su API REST oficial, preservando permisos, historial, reglas, notificaciones, SLA y plugins.

La autorización depende de usuario habilitado, perfil GLPI, entidad, recursividad, grupo, relación con el ticket, derecho específico y estado. Denegar por defecto.

Evitar IDOR, exposición de tareas privadas, soluciones fuera de asignación, broadcasts globales de SignalR y cambios arbitrarios de estado.

Estado GLPI 3 = En proceso (planificado). Crear programación real TicketTask; no simularla mediante PATCH genérico a 3. Respetar la matriz de ciclo de vida de GLPI.

Operaciones sensibles: validar antes de efectos; manejar concurrencia, idempotencia persistente, timeouts, reintentos y estados ambiguos.

La identidad actual es GLPI local y el aprovisionamiento manual. No añadir autorregistro ni integrar SSO/MFA sin una decisión explícita de producto.

5. Entornos y pruebas destructivas

No tocar producción ni servicios persistentes para pruebas mutantes. Los datos actuales pueden ser de prueba, pero eso no convierte cualquier base en desechable.

E2E y seeds sólo en fixture exclusivo H-20, con identidad de proyecto, labels, sentinels, redes, volúmenes y opt-in verificados antes de SQL y cleanup.

Si falta una verificación, abortar sólo esa operación; no desactivar el guard para hacer pasar una suite.

No asumir que una prueba es PASS porque compila. Diferenciar PASS, FAIL, SKIP, BLOCKED y NOT_VERIFIED por plataforma.

Los problemas específicos de Windows/WSL o crashes nativos deben diagnosticarse por proceso y compararse con Linux/CI, sin atribuir automáticamente la causa al código fuente.

6. Puertas de calidad proporcionales

Antes de declarar una corrección terminada:

Compilación backend Release y typecheck/build frontend relevantes, sin errores.

Unitarias y pruebas de integración/E2E pertinentes; para flujos GLPI, al menos una integración real en fixture aislado.

Pruebas negativas de autorización, privacidad y concurrencia cuando apliquen.

git diff --check limpio; revisar .gitattributes antes de normalizar CRLF y evitar reescrituras masivas.

Lint si existe. Si falta script, registrar NOT_CONFIGURED y crear un gate apropiado cuando forme parte del alcance; no fingir que pasó.

Revisión de accesibilidad (WCAG 2.2 AA), responsive, estados vacíos/carga/error para cambios visuales.

Revisar secretos, PII en logs, dependencias, impacto de API y compatibilidad hacia atrás.

Un fallo no relacionado con el cambio no se oculta: se registra con evidencia, propietario y criterio de resolución. Un fallo bloqueante impide declarar READY FOR REVIEW o PRODUCTION-READY según su alcance.

7. Gestión de riesgos y cumplimiento

Mantener trazabilidad de hallazgos H-01…H-22, AUD-N01…AUD-N08, R1…R10 y nuevos hallazgos, con estado y evidencia. Priorizar P0 y P1 antes de publicar. Aplicar alineación técnica interna con ISO/IEC 27001, 27002, 20000-1, 25010, ISO/IEC/IEEE 29119, ISO 22301, OWASP ASVS y WCAG 2.2 AA; no afirmar certificación ISO organizacional.

8. PR, revisión y publicación

Realizar commits/PR pequeños, trazables, sin mezclar cambios ajenos. Se permite preparar PR en borrador cuando esté autorizado.

No autoaprobar, activar auto-merge ni fusionar PR; no desplegar o migrar entornos persistentes sin aprobación humana.

El trabajo puede estar READY FOR HUMAN REVIEW aunque la aprobación/merge externos estén pendientes; no confundirlo con RELEASED.

Revisar PR abiertos/obsoletos antes de fusionarlos, para evitar reintroducir E2E sin guard o cambios incompatibles.

9. Informe de avance y reanudación

Cada entrega incluirá: rama/SHA, archivos, hallazgos cubiertos, decisiones, llamadores afectados, pruebas y resultados, riesgos, rollback, bloqueos y siguiente tarea. Mantener checkpoint versionado sin sobrescribir documentos ajenos.

Formato CAHP sólo cuando exista un traspaso formal; en modo individual SIGUIENTE describe la próxima tarea de Codex o la revisión humana:

[CAMBIÓ]: archivos modificados
[AFECTA]: componentes y flujos afectados
[RIESGO]: bajo | medio | alto | crítico | desconocido
[SIGUIENTE]: próxima tarea de Codex | revisión humana | bloqueo externo

No terminar una misión con instrucciones manuales evitables sin ejecutarlas. Las acciones que requieren autoridad externa se documentan como BLOCKED o AWAITING_HUMAN_APPROVAL, con el paso exacto, y se continúa trabajo independiente permitido.

10. Zona gestionada por GitNexus

Las reglas anteriores son permanentes. El bloque siguiente puede ser gestionado por GitNexus; no colocar aquí nuevas políticas del proyecto. Preferir analyze --skip-agents-md para actualizar el índice.

<!-- gitnexus:start -->

<!-- Contexto generado por GitNexus, si está disponible. -->

<!-- gitnexus:end -->