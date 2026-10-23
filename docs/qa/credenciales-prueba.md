# Credenciales de prueba — H-38 (estructura de 3 grupos)

> Entorno **no productivo**. Todos los tickets, soluciones, seguimientos y usuarios
> listados aquí son datos de prueba y se pueden borrar en cualquier momento con
> `scripts/clean-glpi.sql`. El único usuario que nunca se elimina es el super-admin
> de GLPI (`glpi`).

## 1. Estructura organizacional

| Grupo | ID | Líder (`supervisor`) | Técnico |
|-------|----|----------------------|---------|
| Desarrollo | 1 | `lider_dev` | `tech_dev` |
| BI | 2 | `lider_bi` | `tech_bi` |
| Service Desk | 3 | `lider_sd` | `tech_sd` |

### Enrutamiento categoría → grupo

| Categoría (id) | Grupo destino |
|----------------|---------------|
| `dev` (11), `aplicaciones gsi` (12), `software` (13) | Desarrollo (1) |
| `requerimiento BI` (14) | BI (2) |
| `Call Center` (15), `Hardware` (16), `Soporte Nivel 1` (17), `Informes` (18), `Periféricos` (19), `Requerimiento` (2) | Service Desk (3) |

Las reglas viven en `glpi_rules` / `glpi_rulecriterias` / `glpi_ruleactions` con los
nombres `H38 Route Desarrollo`, `H38 Route BI` y `H38 Route Service Desk`.

## 2. Usuarios de la estructura — contraseña `Password123!`

| Usuario | ID | Contraseña | Rol en la app | Perfil GLPI | Grupo |
|---------|----|------------|---------------|-------------|-------|
| `admin_test` | 10 | `Password123!` | `admin` | Super-Admin (4) | — (ve los 3 grupos) |
| `lider_dev` | 11 | `Password123!` | `supervisor` | Technician (6) + override | Desarrollo (1) |
| `lider_bi` | 12 | `Password123!` | `supervisor` | Technician (6) + override | BI (2) |
| `lider_sd` | 13 | `Password123!` | `supervisor` | Technician (6) + override | Service Desk (3) |
| `tech_dev` | 14 | `Password123!` | `technician` | Technician (6) | Desarrollo (1) |
| `tech_bi` | 15 | `Password123!` | `technician` | Technician (6) | BI (2) |
| `tech_sd` | 16 | `Password123!` | `technician` | Technician (6) | Service Desk (3) |
| `user_test` | 17 | `Password123!` | `solicitante` | Self-Service (1) | — |

El hash bcrypt de `Password123!` usado en el seed es
`$2y$12$8wEbIJkabO5qjJNx2bBsA.rKVyOzykWYwCBNT.aBxyRUTpFrC8WPC`
(generado con `password_hash()` sobre el propio contenedor GLPI).

Los líderes obtienen el rol `supervisor` mediante `user_role_overrides` en PostgreSQL
(`user_id` 11/12/13, `granted_by` 10); GLPI solo distingue Super-Admin / Technician /
Self-Service.

## 3. Usuarios de fixture (solo suite Playwright)

| Usuario | ID | Contraseña | Uso |
|---------|----|------------|-----|
| `tech1` | 7 | `Tech1Pass!` | `storageState` por defecto de la suite; pertenece a Desarrollo (1) y Service Desk (3) para probar el selector multi-grupo |
| `tech2` | 8 | `Tech1Pass!` | Pruebas de segundo técnico |
| `solicitante_test` | 18 | `Tech1Pass!` | Pruebas de creación de tickets |

Estos usuarios **no forman parte de la estructura**: los crea
`scripts/seed-e2e.sql` antes de cada ejecución de Playwright y
`scripts/clean-glpi.sql` los elimina.

## 4. Tickets demo (seed `scripts/seed-h38.sql`)

| ID | Título | Grupo | Estado | Categoría |
|----|--------|-------|--------|-----------|
| 11 | `[Dev] Error en módulo de facturación` | Desarrollo (1) | Nuevo (1) | `software` (13) |
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

### 6.1 Técnico Desarrollo — `tech_dev` / `Password123!`
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

### 6.2 Técnico BI — `tech_bi` / `Password123!`
1. Login → el Kanban muestra solo `Grupo: BI`.
2. `GET /api/tickets/by-group?groupId=1` (Desarrollo) responde **403**.

### 6.3 Líder Desarrollo — `lider_dev` / `Password123!`
1. `/equipo` → tabla con `lider_dev` y `tech_dev` y su carga en vivo.

### 6.4 Admin — `admin_test` / `Password123!`
1. `/administracion` → resumen con exactamente 3 grupos: Desarrollo, BI, Service Desk.

### 6.5 Solicitante — `user_test` / `Password123!`
1. Login → vista de tickets del solicitante.
2. Crear un ticket con categoría `software` → la regla H38 lo enruta a **Desarrollo**
   y aparece en la cola de `tech_dev`.

## 7. Scripts de mantenimiento

```powershell
# Limpieza profunda (borra tickets/usuarios/followups/soluciones de prueba)
Get-Content scripts\clean-glpi.sql | docker exec -i glpi-db mariadb -uglpi -p$env:MARIADB_PASSWORD glpi

# Estructura de 3 grupos + tickets demo (sin fixtures)
Get-Content scripts\seed-h38.sql | docker exec -i glpi-db mariadb -uglpi -p$env:MARIADB_PASSWORD glpi

# Estructura + fixtures Playwright (lo ejecuta global-setup.ts antes de cada suite)
Get-Content scripts\seed-e2e.sql | docker exec -i glpi-db mariadb -uglpi -p$env:MARIADB_PASSWORD glpi
```

```powershell
# Aceptación con clics reales (39 comprobaciones, capturas y reporte JSON)
cd frontend; node tests/qa/h38-acceptance.mjs

# Suite E2E completa (40 pruebas)
cd frontend; pnpm test --project=chromium
```

## 8. Notas

- `scripts/seed-e2e.sql` = sección organizacional de `seed-h38.sql` + fixtures de
  Playwright. Si cambias grupos, usuarios, categorías o reglas, replica el cambio en
  ambos ficheros.
- `pytest`/Playwright usan `workers: 1`; la suite completa supera los dos minutos, así
  que conviene lanzarla por lotes o con un timeout amplio.
- La prueba `full-user-journey.spec.ts` usa el formulario nativo de GLPI por defecto;
  en este entorno se ejecuta con `E2E_GLPI_NATIVE=false` (crea el ticket vía API
  autenticada, igual que CI).
