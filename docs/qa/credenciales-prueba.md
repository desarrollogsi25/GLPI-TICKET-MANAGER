# Credenciales de prueba — H-38 (estructura de 3 grupos)

> Entorno **no productivo**. Todos los tickets, soluciones, seguimientos y usuarios
> listados aquí son datos de prueba y se pueden borrar en cualquier momento con
> `scripts/clean-glpi.sql`. El único usuario que nunca se elimina es el super-admin
> de GLPI (`glpi`).

## 0. Dónde están las contraseñas (no se publican)

Las contraseñas **no se versionan**. Desde la rotación del **2026-11-04** viven
únicamente en el archivo local `.env.local` (git-ignored) en la raíz del repositorio:

| Variable en `.env.local` | Cuenta |
|--------------------------|--------|
| `CRED_ADMIN_TEST` | `admin_test` |
| `CRED_LIDER_DEV` | `lider_dev` |
| `CRED_LIDER_BI` | `lider_bi` |
| `CRED_LIDER_SD` | `lider_sd` |
| `CRED_TECH_DEV` | `tech_dev` |
| `CRED_TECH_BI` | `tech_bi` |
| `CRED_TECH_SD` | `tech_sd` |
| `CRED_USER_TEST` | `user_test` |
| `CRED_GLPI` | super-admin `glpi` de GLPI |

Los valores anteriores a la rotación **ya no son válidos** para estas cuentas y
fueron retirados de este documento. Los scripts de QA que necesiten autenticarse
deben leer las variables de entorno anteriores; no deben incorporar contraseñas en
el código.

Para regenerar el archivo local a partir de las variables del stack:

```bash
# Ejemplo de uso en PowerShell: carga las credenciales en la sesión actual
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^(CRED_[A-Z_]+)=(.*)$') { Set-Item "env:$($matches[1])" $matches[2] }
}
```

## 1. Estructura organizacional

| Grupo | ID | Líder (`supervisor`) | Técnico |
|-------|----|----------------------|---------|
| Desarrollo | 1 | `lider_dev` | `tech_dev` |
| BI | 2 | `lider_bi` | `tech_bi` |
| Service Desk | 3 | `lider_sd` | `tech_sd` |

### Enrutamiento categoría → grupo (reglas H38, verificadas en la BD)

| Categoría (id) | Grupo destino |
|----------------|---------------|
| `Desarrollo` (1), `Software` (4), `Aplicaciones` (5), `Aplicaciones GSI` (9), `Dev` (11) | Desarrollo (1) |
| `BI` (10), `Requerimiento BI` (14), `Informes` (18) | BI (2) |
| `Requerimiento` (2), `Acceso a sistema` (3), `Sistema` (6), `Service Desk` (7), `Call Center` (15), `Hardware` (16), `Soporte Nivel 1` (17), `Periféricos` (19) | Service Desk (3) |

Las reglas viven en `glpi_rules` / `glpi_rulecriterias` / `glpi_ruleactions` con los
nombres `H38 Route Desarrollo`, `H38 Route BI` y `H38 Route Service Desk`.

## 2. Usuarios de la estructura

| Usuario | ID | Rol en la app | Perfil GLPI | Grupo |
|---------|----|---------------|-------------|-------|
| `admin_test` | 10 | `admin` | Super-Admin (4) | — (ve los 3 grupos) |
| `lider_dev` | 11 | `supervisor` | Technician (6) + override | Desarrollo (1) |
| `lider_bi` | 12 | `supervisor` | Technician (6) + override | BI (2) |
| `lider_sd` | 13 | `supervisor` | Technician (6) + override | Service Desk (3) |
| `tech_dev` | 14 | `technician` | Technician (6) | Desarrollo (1) |
| `tech_bi` | 15 | `technician` | Technician (6) | BI (2) |
| `tech_sd` | 16 | `technician` | Technician (6) | Service Desk (3) |
| `user_test` | 17 | `solicitante` | Self-Service (1) | — |

Los líderes obtienen el rol `supervisor` mediante `user_role_overrides` en PostgreSQL
(`user_id` 11/12/13, `granted_by` 10); GLPI solo distingue Super-Admin / Technician /
Self-Service.

## 3. Usuarios de fixture (solo suite Playwright)

| Usuario | ID | Uso |
|---------|----|-----|
| `tech1` | 7 | `storageState` por defecto de la suite; pertenece a Desarrollo (1) y Service Desk (3) para probar el selector multi-grupo |
| `tech2` | 8 | Pruebas de segundo técnico |
| `solicitante_test` | 18 | Pruebas de creación de tickets |

La contraseña de fixture la define y restablece `scripts/e2e/run.mjs` dentro del
fixture efímero; no se publica aquí. Estos usuarios **no forman parte de la
estructura**: los crea `scripts/seed-e2e.sql` antes de cada ejecución de Playwright y
`scripts/clean-glpi.sql` los elimina.

## 4. Tickets demo (seed `scripts/seed-h38.sql`)

| ID | Título | Grupo | Estado | Categoría |
|----|--------|-------|--------|-----------|
| 11 | `[Dev] Error en módulo de facturación` | Desarrollo (1) | Nuevo (1) | `software` (4) |
| 12 | `[BI] Dashboard no actualiza datos` | BI (2) | Nuevo (1) | `requerimiento BI` (14) |
| 13 | `[SD] Monitor no enciende` | Service Desk (3) | Nuevo (1) | `Hardware` (16) |
| 14 | `[SD] Solicitud nuevo auricular` | Service Desk (3) | Nuevo (1) | `Call Center` (15) |

Los cuatro están **sin técnico asignado**, por lo que aparecen en la cola de su grupo.

## 5. Endpoints

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5173/api (proxy → `glpi-api:8080`)
- **Login**: http://localhost:5173/login
- **GLPI nativo**: http://localhost:8081

## 6. Flujos de verificación (clics reales)

> En los flujos siguientes, «login» implica autenticarse con la contraseña
> correspondiente leída de `.env.local`; ninguna contraseña se escribe en la
> documentación.

### 6.1 Técnico Desarrollo — `tech_dev`

1. Login → el Kanban muestra `Grupo: Desarrollo` (sin selector: solo tiene un grupo).
2. Campana de notificaciones: abre y cierra el panel con un clic.
3. `/queue` → `Asignarme` en el ticket #11 → toast «Ticket asignado correctamente».
4. Kanban → columna *Mis tickets* → `Iniciar` → el ticket pasa a *En progreso*.
5. `/tickets/11` → `Poner en pendiente`: el botón **Confirmar** está deshabilitado
   hasta elegir motivo **y** escribir comentario.
6. Con el ticket en *Pendiente*: `Resolver` está deshabilitado y se muestra el aviso
   «Ticket en Pendiente: usa «Retomar» para volver a En Progreso antes de resolverlo».
7. Kanban → *Pendiente* → `Retomar` → vuelve a *En progreso*.
8. `/tickets/11` → `Resolver` → solución → toast «Ticket resuelto» y el ticket aparece
   en la columna *Resuelto*.

### 6.2 Técnico BI — `tech_bi`

1. Login → el Kanban muestra solo `Grupo: BI`.
2. `GET /api/tickets/by-group?groupId=1` (Desarrollo) responde **403**.

### 6.3 Líder Desarrollo — `lider_dev`

1. `/equipo` → tabla con `lider_dev` y `tech_dev` y su carga en vivo.

### 6.4 Admin — `admin_test`

1. `/administracion` → resumen con exactamente 3 grupos: Desarrollo, BI, Service Desk.
2. `/dashboard` → selector de grupo con Desarrollo, BI y Service Desk (solo
   aparece si hay más de un grupo). El selector cambia la **cola** mostrada;
   las tarjetas de métricas suman todo el alcance global del admin.

### 6.5 Solicitante — `user_test`

1. Login → vista de tickets del solicitante.
2. **No existe** ninguna vía para crear tickets desde Ticket Manager: la creación
   ocurre únicamente en el formulario nativo de GLPI (`http://localhost:8081`).
   Un ticket creado allí con categoría `Software` (4) lo enruta la regla H38 a
   **Desarrollo** y aparece en la cola de `tech_dev`.

### 6.6 Catálogo de servicios GLPI

1. `http://localhost:8081` → «Catálogo de servicios» → verificar la tarjeta
   **Acceso a sistema**.
2. Completar el formulario y enviarlo → el ticket se crea con categoría ITIL 3
   (`Requerimiento > Acceso a sistema`) y se enruta a **Service Desk** (grupo 3).

## 7. Scripts de mantenimiento

Los scripts mutantes ya **no** se ejecutan contra `glpi-db`/`glpi-dev` por nombre.
Todos pasan por `scripts/e2e/guard.mjs`, exigen un manifiesto de fixture efímero y
la confirmación `E2E_CONFIRM_DESTRUCTIVE=<runId>` emitida por el runner. Sin esa
confirmación abortan antes del primer DML. Los SQL (`clean-glpi.sql`,
`seed-h38.sql`, `seed-e2e.sql`) además abortan dentro de MariaDB si no existe el
centinela `e2e_fixture_identity`.

La restauración del formulario «Acceso a sistema» **ya está aplicada y verificada**
en la instancia: el catálogo nativo (`http://localhost:8081/ServiceCatalog`) muestra
la tarjeta y un ticket enviado desde ella (por ejemplo el #1027 del 2026-11-05) se
crea con categoría `Requerimiento > Acceso a sistema` y se enruta a Service Desk.
Cualquier reparación puntual futura del catálogo debe ejecutarse con autorización
explícita y los mismos controles que el resto de operaciones mutantes; no se
versiona ningún script que escriba directamente sobre la base persistente.
