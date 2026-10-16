# Procedimiento de rotación de secretos

Este documento establece el procedimiento estándar para la rotación de credenciales, claves de cifrado y tokens de servicio del proyecto GLPI Ticket Manager.

---

## 1. Política de rotación

| Tipo de evento | Alcance | Plazo de ejecución |
|---|---|---|
| **Rotación periódica programada** | Todos los secretos (`JWT_SECRET`, passwords de BD, tokens GLPI) | Trimestral (cada 90 días) |
| **Incidente o sospecha de filtración** | Secretos afectados / todos preventivamente | Inmediato (< 2 horas) |
| **Salida de miembro del equipo** | Todos los secretos de acceso compartido y tokens de CI | En las 24 horas posteriores a la desvinculación |

---

## 2. Inventario de secretos y almacenamiento

| Secreto | Función | Dónde vive |
|---|---|---|
| `MARIADB_ROOT_PASSWORD` | Administración de MariaDB | `.env` local (ignorado) / GitHub Secrets |
| `MARIADB_PASSWORD` | Conexión de la API y GLPI a MariaDB | `.env` local / GitHub Secrets |
| `APP_DB_PASSWORD` | Conexión a PostgreSQL (`app-db`) | `.env` local / GitHub Secrets |
| `JWT_SECRET` | Firma HMAC-SHA256 de tokens de usuario | `.env` local / user-secrets / GitHub Secrets |
| `GLPI_APP_TOKEN` | Identificador de aplicación ante GLPI REST | `.env` local / user-secrets / GitHub Secrets |
| `GLPI_USER_TOKEN` | Token de usuario técnico para mutaciones en GLPI | `.env` local / user-secrets / GitHub Secrets |
| `GLPI_CRYPT_KEY` | Clave AES-256 binaria (`glpicrypt.key`) para tokens en GLPI | GitHub Secrets (base64) / local `scripts/glpicrypt.key` |

---

## 3. Procedimiento paso a paso

### A. Rotación de `JWT_SECRET`
1. Generar una clave criptográfica de al menos 32 caracteres (base64 / hex):
   ```bash
   openssl rand -base64 32
   ```
2. Actualizar `.env` local y/o `.NET user-secrets`:
   ```powershell
   dotnet user-secrets set "Jwt:Key" "<NUEVA_CLAVE>" --project src/GlpiTicketManager.Api
   ```
3. Actualizar el secreto en GitHub Actions:
   ```bash
   echo "<NUEVA_CLAVE>" | gh secret set JWT_SECRET
   ```
4. Reiniciar la API (`docker compose restart api`).
5. **Efecto esperado:** Todos los JWTs emitidos previamente quedan invalidados; los usuarios deberán iniciar sesión nuevamente.

---

### B. Rotación de tokens de GLPI (`GLPI_APP_TOKEN` y `GLPI_USER_TOKEN`)
1. Iniciar sesión en la interfaz web de GLPI (`http://localhost:8081` o URL del entorno).
2. **App Token:**
   - Navegar a *Configuración → General → pestaña API*.
   - Abrir el cliente API existente o generar un nuevo identificador.
   - Copiar el nuevo `App Token`.
3. **User Token:**
   - Ir a la cuenta del usuario de servicio (ej. `glpi` o cuenta técnica) → *Preferencia → Token API*.
   - Hacer clic en **Regenerar**, guardar y copiar el nuevo token.
4. Actualizar `.env` y GitHub Secrets:
   ```bash
   echo "<NUEVO_APP_TOKEN>" | gh secret set GLPI_APP_TOKEN
   echo "<NUEVO_USER_TOKEN>" | gh secret set GLPI_USER_TOKEN
   ```
5. Verificar el par de tokens con `curl`:
   ```bash
   curl -s -H "App-Token: <NUEVO_APP_TOKEN>" \
           -H "Authorization: user_token <NUEVO_USER_TOKEN>" \
           http://localhost:8081/apirest.php/initSession
   # Debe responder: {"session_token":"..."}
   ```

---

### C. Rotación de passwords de Base de Datos (`MARIADB_PASSWORD`, `APP_DB_PASSWORD`)
1. Generar contraseñas robustas (mínimo 24 caracteres alfanuméricos).
2. Actualizar la contraseña en el motor de base de datos (`ALTER USER ... IDENTIFIED BY '...'`).
3. Actualizar `.env` y los secretos de GitHub Actions (`gh secret set MARIADB_PASSWORD`, etc.).
4. Si se utiliza la plantilla de configuración de GLPI:
   - `scripts/config_db.php` se regenera automáticamente desde `scripts/config_db.php.template` con el nuevo `MARIADB_PASSWORD`.
5. Reiniciar los servicios de API y GLPI.

---

### D. Rotación de `GLPI_CRYPT_KEY`
1. **Nota crítica:** `GLPI_CRYPT_KEY` es la clave con la que GLPI cifra internamente los tokens en la base de datos.
2. Al rotar `glpicrypt.key`, todos los tokens cifrados existentes en GLPI quedarán inaccesibles y deben regenerarse en la interfaz web de GLPI inmediatamente después de cambiar la clave.
3. Generar nueva clave:
   ```bash
   openssl rand 32 > scripts/glpicrypt.key
   ```
4. Codificar en base64 para GitHub Secrets:
   ```bash
   base64 -w 0 scripts/glpicrypt.key | gh secret set GLPI_CRYPT_KEY
   ```
5. Copiar al contenedor GLPI:
   ```bash
   docker compose cp scripts/glpicrypt.key glpi:/var/glpi/config/glpicrypt.key
   docker compose restart glpi
   ```
6. Regenerar los tokens de API dentro de GLPI según el paso B.

---

## 4. Verificación post-rotación

Tras cualquier rotación, verificar:
1. Endpoint de salud: `GET http://localhost:8080/health` → `{"status":"ok"}`.
2. Endpoint de readiness: `GET http://localhost:8080/health/ready` → `200 OK` (valida MariaDB y PostgreSQL).
3. Operaciones de lectura y escritura:
   - Lectura: `GET /api/tickets` con JWT recién emitido.
   - Escritura: `PATCH /api/tickets/{id}/status` para asegurar que GLPI REST API acepta los tokens.
4. Ejecutar el smoke test automatizado:
   ```bash
   bash scripts/test-audit.sh
   ```

---

## 5. Prevención y escaneo automatizado

- **Gitleaks en CI:** El pipeline de GitHub Actions ejecuta `gitleaks` en cada push y PR para detectar cualquier intento de versionado accidental de credenciales.
- **Git Ignore:** Todos los archivos con claves reales (`scripts/config_db.php`, `scripts/glpicrypt.key`, `*.key`, `.env*`) están estrictamente excluidos en `.gitignore`.
- **Plantillas:** Las configuraciones compartidas se distribuyen exclusivamente como plantillas (`.template` o `.example`).
