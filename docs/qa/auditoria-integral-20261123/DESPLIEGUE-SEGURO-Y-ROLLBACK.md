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

Para evitar la discrepancia de nombres de carpeta, la falta de variables en sesiones nuevas de PowerShell y la corrupción de bytes por codificación de texto de PowerShell con `pg_dump -Fc` o `mariadb-dump`:

| Ámbito de Ejecución | Comando / Operación | Propósito y Garantía |
|---|---|---|
| **Contenedor Docker (`glpi-db`)** | `mariadb-dump --single-transaction --routines --triggers ... > /tmp/...` | Generación nativa sin paso por pipes del host. |
| **Contenedor Docker (`glpi-db`)** | `sha256sum /tmp/glpi-mariadb.sql` | Hash criptográfico fuente calculado en el origen. |
| **Windows PowerShell** | `docker cp glpi-db:/tmp/... "$backupDir/..."` | Transferencia binaria bit a bit preservando integridad. |
| **Windows PowerShell** | `Get-FileHash "$backupDir/..." -Algorithm SHA256` | Verificación de paridad: el hash destino debe coincidir exactamente. |
| **Contenedor Docker (`glpi-app-db`)** | `pg_dump -U app -Fc ... -f /tmp/...` | Volcado binario custom (-Fc) con compresión nativa. |
| **Contenedor Docker (`glpi-app-db`)** | `sha256sum /tmp/app-db.dump` | Hash criptográfico fuente de PostgreSQL. |
| **Windows PowerShell** | `docker cp glpi-app-db:/tmp/... "$backupDir/..."` | Transferencia binaria bit a bit al disco del host. |
| **Windows PowerShell** | Comprobación `$LASTEXITCODE -eq 0` en cada paso | Aborta el script inmediatamente ante cualquier error sin imprimir secretos. |

```powershell
# Función de verificación de código de salida seguro (sin exponer secretos en consola)
function Assert-LastExitCode {
    param([string]$StepDescription)
    if ($LASTEXITCODE -ne 0) {
        throw "ERROR CRÍTICO: Falló el paso '$StepDescription' con exit code $LASTEXITCODE. Proceso de respaldo abortado."
    }
}

# 1. Carga segura de variables desde .env si no existen en la sesión interactiva de PowerShell (sin imprimir secretos)
if (-not $env:MARIADB_ROOT_PASSWORD -and (Test-Path ".env")) {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*MARIADB_ROOT_PASSWORD\s*=\s*(.*)$') {
            $env:MARIADB_ROOT_PASSWORD = $matches[1].Trim('"').Trim("'")
        }
    }
}
if (-not $env:MARIADB_ROOT_PASSWORD) {
    throw "ERROR: MARIADB_ROOT_PASSWORD no está definida en la sesión ni en .env"
}

# 2. Crear carpeta con marca temporal consistente
$backupDir = "backups/pre-glpi-11.0.13-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

# 3. MariaDB GLPI Completa (dump dentro del contenedor, hash fuente, copia binaria y verificación en host)
Write-Host "Generando backup MariaDB en glpi-db..." -ForegroundColor Cyan
docker exec glpi-db sh -c 'mariadb-dump --single-transaction --routines --triggers -u root -p"$MARIADB_ROOT_PASSWORD" glpi > /tmp/glpi-mariadb.sql'
Assert-LastExitCode "mariadb-dump en glpi-db"

$mariaContainerHashOutput = (docker exec glpi-db sha256sum /tmp/glpi-mariadb.sql)
Assert-LastExitCode "sha256sum en glpi-db"
$mariaContainerHash = ($mariaContainerHashOutput -split '\s+')[0].Trim().ToLower()

docker cp glpi-db:/tmp/glpi-mariadb.sql "$backupDir/glpi-mariadb.sql"
Assert-LastExitCode "docker cp glpi-mariadb.sql al host"

docker exec glpi-db rm -f /tmp/glpi-mariadb.sql

$mariaHostHash = (Get-FileHash "$backupDir/glpi-mariadb.sql" -Algorithm SHA256).Hash.ToLower()
if ($mariaContainerHash -ne $mariaHostHash) {
    throw "ERROR DE INTEGRIDAD: Hash SHA-256 de MariaDB no coincide. Contenedor: $mariaContainerHash vs Host: $mariaHostHash"
}
Write-Host "MariaDB backup verificado OK: $mariaHostHash" -ForegroundColor Green

# 4. PostgreSQL app-db (Preservando bytes binarios puros vía docker cp y verificación de hash)
Write-Host "Generando backup PostgreSQL en glpi-app-db..." -ForegroundColor Cyan
docker exec glpi-app-db pg_dump -U app -Fc glpi_ticket_manager -f /tmp/app-db.dump
Assert-LastExitCode "pg_dump en glpi-app-db"

$pgContainerHashOutput = (docker exec glpi-app-db sha256sum /tmp/app-db.dump)
Assert-LastExitCode "sha256sum en glpi-app-db"
$pgContainerHash = ($pgContainerHashOutput -split '\s+')[0].Trim().ToLower()

docker cp glpi-app-db:/tmp/app-db.dump "$backupDir/app-db.dump"
Assert-LastExitCode "docker cp app-db.dump al host"

docker exec glpi-app-db rm -f /tmp/app-db.dump

$pgHostHash = (Get-FileHash "$backupDir/app-db.dump" -Algorithm SHA256).Hash.ToLower()
if ($pgContainerHash -ne $pgHostHash) {
    throw "ERROR DE INTEGRIDAD: Hash SHA-256 de PostgreSQL no coincide. Contenedor: $pgContainerHash vs Host: $pgHostHash"
}
Write-Host "PostgreSQL backup verificado OK: $pgHostHash" -ForegroundColor Green

# 5. Resumen final de hashes persistidos
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
   # Restaurar MariaDB (preservando integridad binaria sin piping de PowerShell):
   docker cp "$backupDir/glpi-mariadb.sql" glpi-db:/tmp/glpi-mariadb-restore.sql
   docker exec glpi-db sh -c 'mariadb -u root -p"$MARIADB_ROOT_PASSWORD" glpi < /tmp/glpi-mariadb-restore.sql'
   docker exec glpi-db rm -f /tmp/glpi-mariadb-restore.sql

   # Restaurar PostgreSQL:
   docker cp "$backupDir/app-db.dump" glpi-app-db:/tmp/app-db-restore.dump
   docker exec glpi-app-db pg_restore -U app -d glpi_ticket_manager --clean --if-exists /tmp/app-db-restore.dump
   docker exec glpi-app-db rm -f /tmp/app-db-restore.dump
   ```
4. Levantar nuevamente y repetir los checks de salud de la sección 4.
