# Credenciales de Prueba - H-38

## Usuarios GLPI (MaríaDB)

| Usuario | Contraseña | Rol | Grupo | Perfil GLPI |
|---------|------------|-----|-------|-------------|
| `admin_test` | `AdminPass!` | **Admin** | Call Center (id 1) | Super-Admin (4) |
| `tech_gsi` | `TechGsiPass!` | **Técnico** | Aplicaciones GSI (id 5) | Technician (6) |
| `tech_hardware` | `TechHardPass!` | **Técnico** | Hardware (id 7) | Technician (6) |
| `supervisor_gsi` | `SuperGsiPass!` | **Supervisor** | Aplicaciones GSI (id 5) | Technician (6) + override `supervisor` |
| `solicitante` | `SoliPass!` | **Solicitante** | Sin grupo | Self-Service (1) |

## Tickets de Prueba

| ID | Título | Grupo | Estado | Categoría |
|----|--------|-------|--------|-----------|
| 11 | `[GSI] Error en módulo de facturación` | Aplicaciones GSI (5) | Nuevo (1) | Aplicaciones GSI (13) |
| 12 | `[HW] Monitor no enciende` | Hardware (7) | Nuevo (1) | Hardware (11) |
| 13 | `[CC] Solicitud de nuevo auricular` | Call Center (1) | Nuevo (1) | Software (12) |

## Endpoints de Prueba

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5173/api
- **Login**: http://localhost:5173/login

## Flujo de Pruebas Recomendado

### 1. Login Técnico GSI (`tech_gsi` / `TechGsiPass!`)
1. Iniciar sesión
2. Verificar que aparece grupo "Aplicaciones GSI" en Kanban
3. Ver ticket #11 en cola
4. Asignarse ticket #11 → pasa a "Mis tickets"
5. Mover a "En progreso" → "Iniciar"
6. Mover a "Pendiente" → modal pide motivo + comentario
7. Verificar notificación en campana
8. Retomar desde "Pendiente" → "En progreso"
9. Resolver → "Resolver" con solución

### 2. Login Técnico Hardware (`tech_hardware` / `TechHardPass!`)
1. Iniciar sesión
2. Verificar que SOLO ve grupo "Hardware"
3. NO debe tener acceso a grupo "Aplicaciones GSI" (403 si intenta)

### 3. Login Supervisor (`supervisor_gsi` / `SuperGsiPass!`)
1. Iniciar sesión
2. Ir a `/equipo` (Dashboard de equipo)
3. Verificar que ve la carga de `tech_gsi` en tiempo real

### 4. Login Admin (`admin_test` / `AdminPass!`)
1. Iniciar sesión
2. Ir a `/administracion` (Dashboard de administración)
3. Verificar que ve todos los grupos y métricas globales

### 5. Login Solicitante (`solicitante` / `SoliPass!`)
1. Iniciar sesión
2. Verificar que ve su vista de tickets (solo sus tickets)

## Notas
- La contraseña `AdminPass!` / `TechGsiPass!` / etc. es la misma que `Tech1Pass!` (hash compartido para pruebas)
- Los usuarios reales usan: `Tech1Pass!` como contraseña (hash `$2y$12$P.ZiC0.ym8zmfw1WHIMf1OH6NenRUoODqaO.WviG65v.HhCW/pTmW`)