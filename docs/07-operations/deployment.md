# Procedimiento de Despliegue y Puesta en Producción

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-07-OPS-DEPLOY | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito

Establece las directrices para el despliegue del sistema GLPI Ticket Manager en entornos de staging y producción utilizando contenedores Docker y orquestación con Docker Compose.

## 2. Requisitos Previos

- Docker Engine 24+ y Docker Compose v2.
- Instancia activa de GLPI 10.0+ / 11.0 con API REST habilitada y tokens generados (`App-Token` y `User-Token`).
- Base de datos relacional MariaDB/MySQL (para GLPI) y PostgreSQL 16+ (para datos propios del sistema: auditoría, preferencias, revoked tokens).
- Fichero `.env` configurado a partir de `.env.example` con contraseñas seguras y claves criptográficas de longitud mínima requerida (JWT ≥ 32 caracteres).

## 3. Topología de Contenedores

| Servicio | Imagen / Build | Puerto Interno | Puerto Expuesto | Propósito |
|---|---|---|---|---|
| `glpi-api` | .NET 9 ASP.NET Core | 8080 | 5000 | API REST, SignalR Hub y lógica de negocio |
| `glpi-frontend` | Nginx Alpine + Vite bundle | 80 | 5173 / 80 | SPA React y reverse proxy de `/api` |
| `glpi-app-db` | PostgreSQL 16 Alpine | 5432 | 5432 | Almacén propio (auditoría, roles, tokens revocados) |
| `glpi-db` | MariaDB 10.11 | 3306 | 3306 | Base de datos de GLPI nativo |
| `glpi` | PHP 8.2 Apache (GLPI 11.0) | 80 | 8080 | Aplicación web nativa de GLPI |

## 4. Secuencia de Despliegue

```bash
# 1. Validar variables de entorno y secretos
test -f .env || cp .env.example .env

# 2. Levantar la infraestructura base
docker compose up -d glpi-db glpi-app-db

# 3. Aplicar migraciones en PostgreSQL
bash scripts/migrate-app-db.sh

# 4. Compilar y desplegar backend y frontend
docker compose build api frontend
docker compose up -d api frontend

# 5. Verificación de salud (Healthchecks)
curl -f http://localhost:5000/api/auth/me || true
curl -f http://localhost:5173/ || exit 1
```

## 5. Verificación Post-Despliegue

- Ejecutar suite de smoke tests: `bash scripts/test-audit.sh`.
- Verificar logs sin excepciones: `docker compose logs --tail=100 api`.
