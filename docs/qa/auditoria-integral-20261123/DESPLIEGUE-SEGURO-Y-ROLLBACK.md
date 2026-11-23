# Procedimiento de Despliegue Seguro y Rollback — Actualización a GLPI 11.0.13 / PHP 8.5.13

> **Precondición obligatoria:** Aprobación humana explícita y ventana de mantenimiento acordada. Nunca ejecutar sin respaldo verificado previo.

---

## 1. Respaldo Previo Verificado (Antes de Tocar Contenedores)

1. Crear carpeta con marca temporal en `backups/pre-glpi-11.0.13-<YYYYMMDD-HHMM>/`.
2. Respaldar MariaDB (`glpi-db`) y PostgreSQL (`glpi-app-db`) con verificación de tamaño e integridad:
   ```powershell
   # MariaDB GLPI (solo lectura, transacción consistente)
   docker exec glpi-db mariadb-dump --single-transaction --routines --triggers -u root -p"$env:MARIADB_ROOT_PASSWORD" glpi > backups/pre-glpi-11.0.13/glpi-mariadb.sql
   # PostgreSQL app-db
   docker exec glpi-app-db pg_dump -U app -Fc glpi_ticket_manager > backups/pre-glpi-11.0.13/app-db.dump
   # Verificar archivos no vacíos y hash SHA-256
   Get-FileHash backups/pre-glpi-11.0.13/* -Algorithm SHA256
   ```
3. Registrar las imágenes y digests actuales para rollback inmediato:
   - Digest anterior GLPI: `glpi/glpi:11.0@sha256:45572164994cbd12bedd99bf6dd954b7962076dd3b529f0fdc4a84131f30a32a` (11.0.11 / PHP 8.5.11).
   - Etiquetar imagen actual de API y Frontend antes de recompilar:
     ```powershell
     docker tag sistemaopensourceglpi-api:latest sistemaopensourceglpi-api:rollback-pre-11.0.13
     docker tag glpi-ticket-manager-frontend:local glpi-ticket-manager-frontend:rollback-pre-11.0.13
     ```

---

## 2. Despliegue Controlado (Solo Tras Merge Aprobado)

1. Pull verificado de la imagen objetivo por digest:
   ```powershell
   docker pull glpi/glpi:11.0@sha256:9bcedc76763ff9642761f53eb82ec48f944135074b7c83e84af2b7199251a261
   ```
2. Levantar el stack preservando volúmenes (`glpi-db-data`, `glpi-data`, `glpi-plugins`, `app-db-data`; **NUNCA** usar `down -v`):
   ```powershell
   docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml up -d --build
   ```
3. Verificar compatibilidad de esquema GLPI (patch 11.0.11 → 11.0.13 sin migración destructiva):
   ```powershell
   docker exec -u www-data -w /var/www/glpi glpi php bin/console db:check_schema_integrity
   ```

---

## 3. Verificación Post-Despliegue (Health & Smoke)

1. `GET http://127.0.0.1:8080/health` → `200 OK` (`{"status":"ok"}`)
2. `GET http://127.0.0.1:8080/health/ready` → `200 OK` (`mariadb: true`, `postgresql: true`)
3. `GET http://127.0.0.1:8080/openapi/v1.json` en `Production` → `404 Not Found`
4. `GET http://127.0.0.1:8081/apirest.php/initSession` (con `App-Token` + `user_token`) → `200 OK` JSON con `session_token` + `killSession`
5. Login en Frontend (`https://<LAN_IP>`) con cuenta de prueba + verificación de Kanban, colas y SignalR.

---

## 4. Rollback Inmediato (Si Falla Cualquier Check)

1. Detener servicios sin borrar volúmenes:
   ```powershell
   docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml stop api frontend lan-frontend glpi
   ```
2. Restaurar `docker-compose.yml` al commit anterior y reetiquetar `rollback-pre-11.0.13` → `latest`/`local`.
3. Si hubo migración de datos en MariaDB/PostgreSQL, restaurar desde `backups/pre-glpi-11.0.13/` tras verificar SHA-256.
4. Levantar nuevamente y repetir los 5 checks de salud de la sección 3.
