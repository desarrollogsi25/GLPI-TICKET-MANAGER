# Procedimiento de Despliegue y Puesta en Producción (H-19)

> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-07-OPS-DEPLOYMENT | **Versión:** 1.2.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## 1. Propósito y Alcance

Establece el procedimiento operacional estándar para el despliegue de la versión productiva de GLPI Ticket Manager conforme a ISO 9001 (Control Operacional) e ISO 27001 (A.12.1.2 Gestión de Cambios y A.14.2 Seguridad en Desarrollo).

## 2. Requisitos Previos al Lanzamiento

- Servidor Linux / Docker Host con Docker Engine 24+ y Docker Compose v2.
- Puertos requeridos disponibles: `80` (HTTP público), `443` (HTTPS vía reverse proxy / TLS termination), y `5341` (Seq logs, interno o restringido).
- Instancia activa de GLPI con API REST habilitada y credenciales de servicio generadas:
  - `App-Token`: Generado en *Configuración > General > API*.
  - `User-Token`: Generado en la cuenta de servicio de GLPI (*Preferencia > Token API*).
- Clave criptográfica JWT con longitud mínima de 32 caracteres (HMAC-SHA256).

## 3. Preparación de Secretos y Variables (`.env.prod`)

Antes del despliegue, el operador de infraestructura debe instanciar el archivo de entorno en el host:

```bash
# Copiar plantilla base de producción
cp .env.prod.example .env.prod
chmod 600 .env.prod
```

### Variables Mandatorias en `.env.prod`:
| Variable | Descripción | Restricción de Seguridad |
| :--- | :--- | :--- |
| `POSTGRES_PASSWORD` | Contraseña del PostgreSQL (`app-db`) | Mínimo 16 caracteres alfanuméricos |
| `GLPI_DB_PASSWORD` | Contraseña del usuario GLPI en MariaDB | Acceso de solo lectura optimizado |
| `GLPI_APP_TOKEN` | Token de aplicación GLPI API REST | Secreto de alta criticidad |
| `GLPI_USER_TOKEN` | Token de usuario técnico en GLPI | Secreto de alta criticidad |
| `JWT_SECRET` | Clave simétrica de firma de JWT | Mínimo 32 caracteres (FIPS compliant) |

> [!CAUTION]
> El archivo `.env.prod` contiene secretos reales de producción. NUNCA debe ser versionado en Git ni transferido por canales no cifrados.

## 4. Secuencia de Despliegue Automatizada

Para un despliegue sin errores humanos, ejecutar el script de despliegue oficial:

```bash
bash scripts/deploy-prod.sh
```

El script ejecuta automáticamente:
1. Validación de preexistencia de `.env.prod` y `docker-compose.prod.yml`.
2. Compilación multi-stage de imágenes productivas:
   - Backend: .NET runtime endurecido sobre Alpine en modo no-root (`app:1654`).
   - Frontend: Nginx Alpine hardened con cabeceras de seguridad estrictas (HSTS, CSP, X-Frame-Options: DENY, Permissions-Policy).
3. Puesta en marcha de servicios dependientes (`postgres`, `api`, `frontend`, `seq`).
4. Sondeo automatizado al healthcheck (`http://127.0.0.1:${PROD_HTTP_PORT}/health`) hasta confirmar estado operativo (`HTTP 200`).

## 5. Verificación Post-Despliegue (Smoke Testing)

1. **Sondeo de Salud HTTP:**
   ```bash
   curl -I http://localhost/health
   # Debe responder HTTP/1.1 200 OK
   ```
2. **Inspección de Encabezados de Seguridad:**
   ```bash
   curl -I http://localhost/
   # Verificar presencia de:
   # Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   # X-Frame-Options: DENY
   # X-Content-Type-Options: nosniff
   # Content-Security-Policy: default-src 'self' ...
   ```
3. **Revisión de Logs en Tiempo Real:**
   ```bash
   docker compose -f docker-compose.prod.yml logs --tail 50 -f api
   ```

## 6. Procedimiento de Rollback Inmediato

Si se detecta una degradación de servicio o falla crítica posterior al despliegue:

1. **Detener stack actual:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```
2. **Restaurar tag de versión previa:**
   ```bash
   git checkout <TAG_VERSION_ANTERIOR> # Ej: git checkout v1.0.0
   ```
3. **Relanzar versión anterior estable:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. **Registrar incidente:** Abrir reporte en `docs/11-incidents/` según protocolo ISO 27001.

## 7. Acceso a la Plataforma desde la Red Local (LAN)

Para acceder a GLPI Ticket Manager desde otra máquina, portátil o dispositivo móvil conectado a la misma red local:

### 7.1 Identificación de la Dirección IP del Host Servidor
- **En Windows:**
  ```powershell
  ipconfig
  # Localizar el adaptador conectado (Ethernet o Wi-Fi) y anotar la "Dirección IPv4" (ej. 192.168.1.100).
  ```
- **En Linux / macOS:**
  ```bash
  hostname -I | awk '{print $1}'
  # O alternativamente: ip a show | grep 'inet '
  ```

### 7.2 Acceso desde el Navegador en Otro Dispositivo
Abrir el navegador web en cualquier terminal de la red local e ingresar la dirección:
```
http://<IP_DEL_HOST>
# Ejemplo: http://192.168.1.100 (o http://192.168.1.100:80)
```

### 7.3 Configuración de la URL de API (`VITE_API_BASE_URL`)
- Por defecto, el frontend utiliza `/api`, lo cual delega el enrutamiento al reverse proxy Nginx en el puerto 80 del host.
- Si el backend se publica en un puerto o IP independiente de la red, definir en `.env.prod`:
  ```bash
  VITE_API_BASE_URL=http://192.168.1.100:8080/api
  ```
- Reiniciar el contenedor de frontend para aplicar la configuración:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build frontend
  ```
