# Bootstrap de Base de Datos y Configuración en CI/CD

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-07-CI_BOOTSTRAP | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team


Este documento describe el mecanismo de inicialización (bootstrap) de la base de datos GLPI y sus claves de cifrado en entornos efímeros de integración continua (GitHub Actions).

---

## 1. Problema en Entornos Efímeros

En desarrollo local, los volúmenes de Docker (`glpi-db-data` y `glpi-data`) son persistentes y retienen el esquema instalado de GLPI, los usuarios de prueba y las claves simétricas de la aplicación.

En un runner efímero de CI/CD (`ubuntu-latest`):
- Los contenedores se levantan desde cero con volúmenes totalmente vacíos.
- MariaDB crea una base de datos `glpi` vacía, sin tablas.
- GLPI no encuentra su archivo `config_db.php` ni la clave de cifrado `glpicrypt.key`, por lo que no puede autenticar usuarios ni desencriptar tokens de API REST.

---

## 2. Estrategia de Bootstrap

Para garantizar un entorno reproducible, rápido y determinista:

1. **Dump Base Sanitizado (`scripts/glpi-base.sql`):**
   - Contiene el esquema completo de tablas de GLPI (~440 tablas) y la configuración base requerida.
   - Excluye tablas volátiles y de logs (`glpi_logs`, `glpi_events`, `glpi_sessions`) para mantener el tamaño por debajo de 1 MB.

2. **Clave de Cifrado y Configuración de Conexión:**
   - `scripts/glpicrypt.key`: Clave simétrica de 32 bytes requerida por GLPI para desencriptar `api_token` y secretos en base de datos.
   - `scripts/config_db.php`: Configuración de conexión para que el contenedor GLPI se enlace a `glpi-db`. Durante el flujo de CI, la contraseña se sincroniza dinámicamente con `MARIADB_PASSWORD`.

3. **Flujo de Ejecución en CI (`.github/workflows/ci.yml`):**
   1. Valida que los 6 secretos requeridos estén presentes.
   2. Levanta las bases de datos `glpi-db` y `app-db` de forma aislada (`docker compose up -d glpi-db app-db`).
   3. Espera a que los healthchecks de MariaDB y PostgreSQL (`pg_isready`) confirmen disponibilidad.
   4. Restaura `scripts/glpi-base.sql` y `scripts/glpi-schema-events-logs.sql` en MariaDB.
   5. Verifica la presencia de las 4 tablas propias en PostgreSQL (`app-db`) de forma fail-fast.
   6. Levanta el stack completo (`docker compose up -d --build`).
   7. Copia `glpicrypt.key` y `config_db.php` a `/var/glpi/config/` y reinicia el servicio `glpi`.
   8. Espera disponibilidad de API (`/health`) y Frontend (`:5173`).
   9. Instala dependencias y navegador Chromium para Playwright.
   10. Ejecuta Smoke test de API (`PATCH /api/tickets/11/status` con status=2).
   11. Ejecuta `./scripts/seed-e2e.sh` para crear usuarios y restaurar el estado prístino de las fixtures.
   12. Ejecuta la suite E2E de Playwright.

> [!NOTE]
> El step 'Seed E2E state' corre después del smoke test del API y antes de Playwright. Razón: el smoke test muta el ticket #11 (PATCH status=2), y `self-assign-flow.spec.ts` requiere el ticket en status=1. El seed garantiza el estado prístino para la suite E2E.

---

## 3. Base de Datos de Aplicación (`app-db` / PostgreSQL)

Para almacenar estado propio desacoplado de GLPI (preferencias, auditoría interna, revocación de tokens JWT y settings), el stack incluye una instancia PostgreSQL 16 (`app-db`):

- **Arranque anticipado:** Se levanta en el mismo paso inicial que `glpi-db`, antes de compilar y levantar la API y el frontend.
- **Migraciones automáticas:** En entornos limpios/CI, las migraciones ubicadas en `db/migrations/` se montan como volumen de solo lectura en `/docker-entrypoint-initdb.d`, ejecutándose automáticamente por orden lexicográfico al inicializar el cluster.
- **Script de migración idempotente:** Para entornos existentes o ejecución manual, se dispone del script `scripts/migrate-app-db.sh`.
- **Verificación fail-fast:** El workflow ejecuta una consulta a `information_schema.tables` verificando que existan exactamente las 4 tablas esperadas (`app_settings`, `user_preferences`, `audit_log`, `revoked_tokens`). Si faltan tablas, el workflow aborta de inmediato mostrando los logs de `app-db`.
- **Secreto obligatorio:** La variable `APP_DB_PASSWORD` es obligatoria en CI; su ausencia detiene el workflow antes de iniciar cualquier contenedor.

---

## 4. Sembrado Idempotente (`scripts/seed-e2e.sh`)

El script `seed-e2e.sh` garantiza que cada ejecución de pruebas arranque con datos idénticos:
- Inserta los usuarios de prueba (`tech1`, `tech2`, `user1`) con sus hashes y perfiles mediante `INSERT IGNORE`.
- Asegura la existencia de los grupos de prueba (`Call Center`, `Soporte Nivel 1`).
- Asegura la existencia y restablece el ticket `#11` a estado `Nuevo (1)`, sin técnico asignado y sin soluciones previas.

---

## 5. Consideraciones de Seguridad

- **Entorno de Pruebas Aislado:** El dump y las claves versionadas corresponden exclusivamente a datos de desarrollo y testing, sin ninguna información confidencial de producción.
- **Fail Fast sin Placeholders:** El workflow de CI no utiliza placeholders con valores genéricos que silencien errores de autenticación; valida explícitamente la presencia de los 6 secretos requeridos antes de iniciar los servicios.

---

## 6. GitHub Secrets

### Secretos Requeridos en el Repositorio

El job `e2e` del workflow de GitHub Actions requiere los siguientes 6 secretos de repositorio:

| Secreto | Descripción | Componente que lo consume |
|---|---|---|
| `MARIADB_ROOT_PASSWORD` | Contraseña administrativa del contenedor MariaDB | MariaDB inicialización y healthcheck |
| `MARIADB_PASSWORD` | Contraseña del usuario de base de datos `glpi` | MariaDB + GLPI `config_db.php` + .NET API |
| `GLPI_APP_TOKEN` | Token de aplicación para el cliente API de GLPI | Cliente HTTP REST del backend .NET |
| `GLPI_USER_TOKEN` | Token de autenticación del usuario servicio GLPI | Cliente HTTP REST del backend .NET |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT propios (≥32 caracteres) | Autenticación del backend .NET |
| `APP_DB_PASSWORD` | Contraseña del usuario `app` en PostgreSQL (`app-db`) | PostgreSQL inicialización y credenciales API |

### Por qué se necesitan

En el bootstrap de CI, el archivo `scripts/glpi-base.sql` contiene la configuración de GLPI y las credenciales cifradas (mediante `scripts/glpicrypt.key`). Para que la API de .NET pueda invocar los endpoints REST de GLPI (`/apirest.php/initSession`, `/apirest.php/Ticket`), GLPI compara los tokens recibidos en las cabeceras HTTP con los tokens descifrados en la base de datos MariaDB. Si los tokens pasados al contenedor de la API no coinciden exactamente con los de la base de datos restaurada, GLPI rechaza la autenticación (`ERROR_GLPI_LOGIN_USER_TOKEN`) y las pruebas E2E fallan por timeout al no completarse las operaciones.

### Procedimiento de Rotación

Si se requiere cambiar o rotar alguno de estos secretos:

1. **Tokens de GLPI (`GLPI_APP_TOKEN`, `GLPI_USER_TOKEN`):**
   - Iniciar GLPI en local (`docker compose up -d`).
   - Ir a la interfaz web de GLPI (`http://localhost:8081`).
   - En *Configuración > General > API*, regenerar el token del cliente de API (`GLPI_APP_TOKEN`).
   - En *Administración > Usuarios*, seleccionar el usuario de servicio y regenerar su `api_token` (`GLPI_USER_TOKEN`).
   - Actualizar el archivo `.env` local con los nuevos valores.
   - Generar un nuevo dump de base de datos (`scripts/glpi-base.sql`) para capturar los nuevos tokens cifrados.
   - Actualizar los secretos en GitHub: **Settings > Secrets and variables > Actions**.

2. **Contraseñas de MariaDB (`MARIADB_ROOT_PASSWORD`, `MARIADB_PASSWORD`):**
   - Actualizar las variables en el `.env` local.
   - En `scripts/config_db.php`, la contraseña se sincroniza automáticamente durante el workflow en base a `MARIADB_PASSWORD`.
   - Actualizar los valores en los secretos del repositorio en GitHub.

3. **Firma JWT (`JWT_SECRET`):**
   - Generar una cadena criptográfica de al menos 32 caracteres (por ejemplo, con `openssl rand -base64 32`).
   - Actualizar `JWT_SECRET` tanto en `.env` local como en GitHub Secrets.

4. **Contraseña PostgreSQL (`APP_DB_PASSWORD`):**
   - Actualizar la variable en el `.env` local.
   - Actualizar el valor en los secretos del repositorio en GitHub (**Settings > Secrets and variables > Actions**).

---

## 7. Tablas excluidas del dump principal

El dump `scripts/glpi-base.sql` excluye `glpi_logs` y `glpi_events` por tamaño (acumulan millones de filas). Sin embargo, GLPI las requiere para operar (auditoría de login en `initSession`). 

Solución: `scripts/glpi-schema-events-logs.sql` contiene el schema (`CREATE TABLE`) sin datos. Se aplica después del dump principal.

Si en el futuro se excluyen más tablas del dump, verificar que no sean necesarias para el funcionamiento básico de GLPI.
