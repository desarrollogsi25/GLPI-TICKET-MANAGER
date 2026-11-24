# Procedimiento de Despliegue Seguro y Rollback — Actualización a GLPI 11.0.13 / PHP 8.5.13

> **Precondición obligatoria:** Aprobación humana explícita y ventana de mantenimiento acordada. Nunca ejecutar sin respaldo verificado previo. Prohibido `docker compose down -v`.

---

## 1. Verificación Previa de Certificados TLS (HTTPS 443)

El stack en producción redirige HTTP (80) a HTTPS (443) mediante Nginx y requiere que los certificados existan y sean legibles:

```powershell
# 1. Validar existencia y legibilidad antes de iniciar
if (-not (Test-Path "infra/nginx/certs/server.crt") -or -not (Test-Path "infra/nginx/certs/server.key")) {
    throw "ERROR CRÍTICO: No se encontraron los certificados en infra/nginx/certs/. Se requiere provisión obligatoria antes del despliegue."
}

# 2. Comprobar que los archivos tengan contenido no vacío
$crtSize = (Get-Item "infra/nginx/certs/server.crt").Length
$keySize = (Get-Item "infra/nginx/certs/server.key").Length
if ($crtSize -eq 0 -or $keySize -eq 0) {
    throw "ERROR: Certificados corruptos o de 0 bytes."
}
```

### Provisión de Certificados (Si se requiere renovar o aprovisionar nuevo entorno)
> **Política de Seguridad:** No inventar secretos ni autofirmar certificados en producción sin autorización corporativa.
- **Opción A (Recomendada / CA Corporativa):** Solicitar al área de infraestructura/seguridad el certificado emitido para el dominio/IP de la LAN (`10.10.40.31` / `localhost`) firmado por la CA corporativa, y depositar `server.crt` y `server.key` (permisos 600) en `infra/nginx/certs/`.
- **Opción B (Generación local con OpenSSL para laboratorio/staging):**
  ```bash
  # Generar clave privada RSA 2048:
  openssl genrsa -out infra/nginx/certs/server.key 2048
  # Generar CSR con SAN (Subject Alternative Names):
  openssl req -new -key infra/nginx/certs/server.key -out infra/nginx/certs/server.csr -subj "/C=ES/O=Empresa/CN=10.10.40.31"
  # Firmar con la CA autorizada utilizando extfile.cnf:
  openssl x509 -req -in infra/nginx/certs/server.csr -CA infra/nginx/certs/ca.crt -CAkey infra/nginx/certs/ca.key -CAcreateserial -out infra/nginx/certs/server.crt -days 825 -sha256 -extfile infra/nginx/certs/extfile.cnf
  ```

---

## 2. Respaldo Previo Verificado (En Windows PowerShell)

Para evitar la discrepancia de nombres de carpeta y la corrupción de bytes por codificación de texto de PowerShell con `pg_dump -Fc`:

```powershell
# 1. Crear carpeta con marca temporal consistente
$backupDir = "backups/pre-glpi-11.0.13-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# 2. MariaDB GLPI (solo lectura, transacción consistente)
docker exec glpi-db mariadb-dump --single-transaction --routines --triggers -u root -p"$env:MARIADB_ROOT_PASSWORD" glpi | Set-Content -Encoding utf8 "$backupDir/glpi-mariadb.sql"

# 3. PostgreSQL app-db (Preservando bytes binarios puros vía docker cp)
docker exec glpi-app-db pg_dump -U app -Fc glpi_ticket_manager -f /tmp/app-db.dump
docker cp glpi-app-db:/tmp/app-db.dump "$backupDir/app-db.dump"
docker exec glpi-app-db rm -f /tmp/app-db.dump

# 4. Verificar integridad y calcular hashes SHA-256
Get-FileHash "$backupDir/*" -Algorithm SHA256 | Format-Table -AutoSize
```

3. Registrar las imágenes y digests actuales para rollback inmediato:
   - Digest anterior GLPI: `glpi/glpi:11.0@sha256:45572164994cbd12bedd99bf6dd954b7962076dd3b529f0fdc4a84131f30a32a` (11.0.11 / PHP 8.5.11).
   - Etiquetar imagen actual de API y Frontend antes de recompilar:
     ```powershell
     docker tag sistemaopensourceglpi-api:latest sistemaopensourceglpi-api:rollback-pre-11.0.13
     docker tag glpi-ticket-manager-frontend:local glpi-ticket-manager-frontend:rollback-pre-11.0.13
     ```

---

## 3. Despliegue Controlado (Solo Tras Merge Aprobado)

1. Pull verificado de la imagen objetivo por digest:
   ```powershell
   docker pull glpi/glpi:11.0@sha256:9bcedc76763ff9642761f53eb82ec48f944135074b7c83e84af2b7199251a261
   ```
2. Levantar el stack aplicando el overlay `docker-compose.local-sync.yml` (que fija `ASPNETCORE_ENVIRONMENT: Production` y redirige HTTP a HTTPS):
   ```powershell
   docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml up -d --build
   ```
3. Verificar compatibilidad de esquema GLPI (patch 11.0.11 → 11.0.13 sin migración destructiva):
   ```powershell
   docker exec -u www-data -w /var/www/glpi glpi php bin/console db:check_schema_integrity
   ```

---

## 4. Verificación Post-Despliegue (Smoke & Security Gates)

Ejecutar las comprobaciones automáticas de salud y cierre de endpoints:

```powershell
# 1. API Health (200 OK)
Invoke-RestMethod -Uri "http://127.0.0.1:8080/health"
# Esperado: @{ status = "ok" }

# 2. Base de datos Health Ready (200 OK)
Invoke-RestMethod -Uri "http://127.0.0.1:8080/health/ready"
# Esperado: @{ mariadb = True; postgresql = True }

# 3. OpenAPI y Scalar en Production (404 Not Found OBLIGATORIO)
try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8080/openapi/v1.json" -SkipHttpErrorCheck
} catch { $_.Exception.Response.StatusCode }
# Debe retornar 404 Not Found

try {
    Invoke-WebRequest -Uri "http://127.0.0.1:8080/scalar/v1" -SkipHttpErrorCheck
} catch { $_.Exception.Response.StatusCode }
# Debe retornar 404 Not Found

# 4. Redirección HTTP 80 -> HTTPS 443 en Nginx
$res80 = Invoke-WebRequest -Uri "http://127.0.0.1:80/" -MaximumRedirection 0 -SkipHttpErrorCheck
# $res80.StatusCode debe ser 301 y Header 'Location' debe empezar por https://

# 5. GLPI REST API Session
# GET http://127.0.0.1:8081/apirest.php/initSession con App-Token y user_token -> 200 OK
```

---

## 5. Rollback Inmediato (Si Falla Cualquier Check)

1. Detener servicios sin borrar volúmenes:
   ```powershell
   docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml stop api frontend lan-frontend glpi
   ```
2. Restaurar `docker-compose.yml` al commit anterior y reetiquetar `rollback-pre-11.0.13` → `latest`/`local`.
3. Si hubo migración de datos o inconsistencias, restaurar desde `$backupDir`:
   ```powershell
   # Restaurar MariaDB:
   Get-Content "$backupDir/glpi-mariadb.sql" | docker exec -i glpi-db mariadb -u root -p"$env:MARIADB_ROOT_PASSWORD" glpi

   # Restaurar PostgreSQL:
   docker cp "$backupDir/app-db.dump" glpi-app-db:/tmp/app-db-restore.dump
   docker exec glpi-app-db pg_restore -U app -d glpi_ticket_manager --clean --if-exists /tmp/app-db-restore.dump
   docker exec glpi-app-db rm -f /tmp/app-db-restore.dump
   ```
4. Levantar nuevamente y repetir los checks de salud de la sección 4.
