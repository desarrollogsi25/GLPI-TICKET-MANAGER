# Runbook de despliegue y rollback — GLPI Ticket Manager

> Entorno actual: host de demostración en LAN `10.10.40.31` (Windows 10 + Docker Desktop).
> Commit desplegado: `main` `433c6c2` | API `sha256:debeed137f01…` | frontend `sha256:a64f32258f04…`
> Prohibido: `docker compose down -v`, `docker volume prune`, bajadas destructivas o eliminar volúmenes persistentes.

## 1. Topología desplegada

| Servicio compose | Contenedor | Publicación |
| --- | --- | --- |
| `api` | `glpi-api` | `127.0.0.1:8080` |
| `frontend` | `glpi-frontend` | `127.0.0.1:5173` |
| `lan-frontend` | `glpi-lan-frontend` | `0.0.0.0:80` y `0.0.0.0:443` |
| `glpi` | `glpi` | `0.0.0.0:8081` |
| `glpi-db` | `glpi-db` (MariaDB 10.11) | `127.0.0.1:3306` |
| `app-db` | `glpi-app-db` (PostgreSQL 16) | `127.0.0.1:5432` |
| `nginx` | `glpi-nginx` | interna (no publicada) |

Comando base (overlay de demostración):

```bash
docker compose -p sistemaopensourceglpi \
  -f docker-compose.yml -f docker-compose.local-sync.yml <comando>
```

## 2. Pre-despliegue

1. `git fetch origin && git status --short --branch`; confirmar que el commit objetivo es el de `origin/main`.
2. `git diff --check` limpio y CI del commit en verde.
3. Respaldar ambas bases (§4) y verificar sus hashes.
4. Confirmar espacio en disco y que no haya otro proceso desplegando.
5. Anotar imágenes en ejecución para rollback:

```bash
docker inspect glpi-api --format '{{.Image}}'
docker inspect glpi-frontend --format '{{.Image}}'
```

## 3. Despliegue

```bash
# 1) Construir sin tocar datos
docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml \
  build api frontend

# 2) Recrear solo lo que cambió. El API debe forzarse: `up -d` puede reportar
#    "Running" y mantener la imagen anterior tras un rebuild.
docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml \
  up -d --no-deps --force-recreate api frontend
docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml \
  up -d --no-deps --force-recreate lan-frontend

# 3) Confirmar que el contenedor usa la imagen recién construida
docker inspect glpi-api --format '{{.Image}}'
```

Notas operativas:

- No se eliminaron volúmenes ni se modificaron MariaDB/PostgreSQL durante el despliegue.
- En Git Bash (MSYS) usar `MSYS_NO_PATHCONV=1` delante de `docker exec` cuando se pasen rutas `/tmp/...`, o Windows las convierte.
- SDK .NET local: `/c/Users/DEVELOPMENT/AppData/Local/Microsoft/dotnet/dotnet.exe` (10.0.402). El de `Program Files` es 9.0 y falla contra `global.json`.

## 4. Respaldos e integridad

```bash
STAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
mkdir -p scratch/backups/$STAMP

# PostgreSQL de la aplicación (usuario app)
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" glpi-app-db \
  pg_dump -U app -Fc appdb > scratch/backups/$STAMP/appdb.dump

# MariaDB de GLPI (tablas)
docker exec glpi-db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --no-create-db glpi' \
  > scratch/backups/$STAMP/glpi_tables.sql

# Base completa (referencia)
docker exec glpi-db sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --databases glpi' \
  > scratch/backups/$STAMP/glpi.sql

cd scratch/backups/$STAMP && sha256sum * > SHA256SUMS
```

Respaldo de referencia del 2026-11-05 (`scratch/backups/2026-11-05T21-18-16Z/`):

| Archivo | SHA-256 (prefijo) |
| --- | --- |
| `appdb.dump` | `259a4ac2175058c3…` |
| `glpi.sql` | `361df2c1bb1ac5ec…` |
| `glpi_tables.sql` | `45e8aae0c22a6f3d…` |

### Prueba de restauración aislada (obligatoria antes de un cambio riesgoso)

```bash
# PostgreSQL: contenedor efímero sin red, sin volúmenes persistentes
docker run --rm --network none -e POSTGRES_PASSWORD=restore -d --name restore-check postgres:17-alpine
# esperar readiness con psql -tAc "select 1" y luego:
docker exec -e PGPASSWORD=restore restore-check pg_restore -U postgres -d postgres --no-owner --no-privileges /tmp/appdb.dump
docker exec -e PGPASSWORD=restore restore-check psql -U postgres -tAc "select count(*) from notifications"
docker rm -f restore-check

# MariaDB: restaurar en un esquema temporal de solo lectura y eliminarlo al terminar
# (nunca sobre la base viva). Ver RESTORE_CHECK.txt del respaldo.
```

Resultado del 2026-11-05: `notifications=481`; MariaDB `tickets=49`, `users=16`, `webhooks=2`, `tickets_users=51`, idénticos a la base viva; el esquema temporal se eliminó.

## 5. Verificación post-despliegue

```bash
node scratch/final-qa/post-deploy-verify.mjs
```

Debe devolver 9/9: raíz 200, `/health` 200, `/health/ready` 200, GLPI 200, 401 sin sesión, cola de `tech_sd`, dashboard de `lider_sd`, listado de `user_test` y negociación SignalR autenticada.

Comprobación manual rápida:

```bash
curl -sk -o /dev/null -w '%{http_code}\n' http://10.10.40.31/
curl -sk -o /dev/null -w '%{http_code}\n' http://10.10.40.31/api/health
curl -sk -o /dev/null -w '%{http_code}\n' http://10.10.40.31/api/health/ready
curl -sk -o /dev/null -w '%{http_code}\n' http://10.10.40.31:8081/
curl -sk -o /dev/null -w '%{http_code}\n' http://10.10.40.31/api/auth/me   # esperado 401
docker ps --format '{{.Names}} {{.Status}}'
docker logs --since 10m glpi-api 2>&1 | grep -Ei 'error|fail|exception' | head
```

## 6. Reinicio completo (supervivencia)

```bash
docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml restart
# esperar readiness de las bases y repetir §5
```

Durante el reinicio es normal ver uno o dos avisos transitorios del watcher (`Unable to connect to any of the specified MySQL hosts`); debe recuperarse solo. Si persiste más de un minuto, revisar `docker ps` y logs de `glpi-db`.

## 7. Rollback

### 7.1 Rollback de imágenes (rápido, sin tocar datos)

```bash
docker tag sistemaopensourceglpi-api:rollback-20261105-433c6c2 sistemaopensourceglpi-api:latest
docker tag glpi-ticket-manager-frontend:rollback-20261105-433c6c2 glpi-ticket-manager-frontend:local

docker compose -p sistemaopensourceglpi -f docker-compose.yml -f docker-compose.local-sync.yml \
  up -d --no-deps --force-recreate api frontend lan-frontend

node scratch/final-qa/post-deploy-verify.mjs
```

Etiquetas disponibles:

| Imagen | ID |
| --- | --- |
| `sistemaopensourceglpi-api:rollback-20261105-433c6c2` | `debeed137f01` |
| `glpi-ticket-manager-frontend:rollback-20261105-433c6c2` | `a64f32258f04` |
| `sistemaopensourceglpi-api:rollback-20261105-pre-authz` | `819fa448834a` |
| `sistemaopensourceglpi-api:rollback-20261105-premerge` | `854af249742d` |
| `glpi-ticket-manager-frontend:rollback-20261105-premerge` | `0de3642a0ee8` |

### 7.2 Rollback de código

```bash
git revert --no-edit <commit-problemático>
# PR + CI + merge con rebase; nunca force-push sobre main
```

### 7.3 Restauración de datos (solo si hubo corrupción demostrada)

1. Detener únicamente el servicio afectado (`docker compose stop api` o `glpi`).
2. Restaurar en una base temporal y comparar conteos.
3. Con autorización humana explícita, restaurar sobre la base viva usando el respaldo verificado.
4. Repetir §5 y documentar el incidente.

## 8. Criterios de abortar

- CI del commit no está en verde.
- Falta el respaldo o su verificación de hash/restauración.
- `post-deploy-verify` devuelve menos de 9/9 y la causa no es un servicio aún arrancando.
- Aparecen 5xx sostenidos o errores de autorización en logs.
- Cualquier operación sugerida implica borrar volúmenes o datos no sintéticos.
