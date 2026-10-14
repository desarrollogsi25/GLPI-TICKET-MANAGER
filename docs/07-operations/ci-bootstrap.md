# Bootstrap de Base de Datos y Configuración en CI/CD

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
   1. Levanta `glpi-db` de forma aislada.
   2. Espera a que el healthcheck de MariaDB confirme disponibilidad.
   3. Restaura `scripts/glpi-base.sql` en la base de datos `glpi`.
   4. Levanta el stack completo (`docker compose up -d --build`).
   5. Copia `glpicrypt.key` y `config_db.php` a `/var/glpi/config/` y reinicia el servicio `glpi`.
   6. Espera disponibilidad de API (`/health`) y Frontend (`:5173`).
   7. Ejecuta `./scripts/seed-e2e.sh` para crear usuarios y asegurar estado determinista.
   8. Ejecuta la suite E2E de Playwright.

---

## 3. Sembrado Idempotente (`scripts/seed-e2e.sh`)

El script `seed-e2e.sh` garantiza que cada ejecución de pruebas arranque con datos idénticos:
- Inserta los usuarios de prueba (`tech1`, `tech2`, `user1`) con sus hashes y perfiles mediante `INSERT IGNORE`.
- Asegura la existencia de los grupos de prueba (`Call Center`, `Soporte Nivel 1`).
- Asegura la existencia y restablece el ticket `#11` a estado `Nuevo (1)`, sin técnico asignado y sin soluciones previas.

---

## 4. Consideraciones de Seguridad

- **Entorno de Pruebas Aislado:** El dump y las claves versionadas corresponden exclusivamente a datos de desarrollo y testing, sin ninguna información confidencial de producción.
- **Sin Secretos Reales en el Workflow:** El workflow utiliza GitHub Secrets (`secrets.MARIADB_PASSWORD`, etc.) con valores por defecto de fallback solo para la ejecución de pipelines en pull requests y forks seguros.
