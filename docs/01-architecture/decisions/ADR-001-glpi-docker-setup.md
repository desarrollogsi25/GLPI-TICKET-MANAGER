> **Control Documental ISO 9001 / ISO 27001**  
> **Código:** DOC-01-ADR-001 | **Versión:** 1.0.0 | **Fecha:** 2026-10-19 | **Autor:** GLPI Ticket Manager Team

## ADR-001: GLPI Docker Setup

### Context and Problem

- Need to set up GLPI 11 with MariaDB 10.11 using Docker.
- The first revision of the compose file used the GLPI **9.x** volume paths
  (`/var/lib/glpi`, `/etc/glpi`, `/var/www/glpi/marketplace`). Verification
  against the official image showed these are **not** the paths used by
  `glpi/glpi:11.0`, so config and data were not actually persisted.

### Decision

- Use the official `glpi/glpi:11.0` image.
- Use the `mariadb:10.11` image (fixed, not `latest`).
- **Persist the paths the 11.0 image actually uses** (source:
  <https://hub.docker.com/r/glpi/glpi>, sections *Volumes* and *Path
  configuration*):
  - `glpi-config` → `/var/glpi/config`
  - `glpi-files` → `/var/glpi/files`
  - `glpi-logs` → `/var/glpi/logs`
  - `glpi-marketplace` → `/var/glpi/marketplace`
  - `glpi-plugins` → `/var/www/glpi/plugins`
  - `glpi-db-data` → `/var/lib/mysql`
  - Remove `/var/lib/glpi` and `/etc/glpi` (GLPI 9.x paths).
- Create a dedicated MariaDB user: `MARIADB_USER` / `MARIADB_PASSWORD`, next to
  `MARIADB_ROOT_PASSWORD` and `MARIADB_DATABASE`. GLPI and the API connect with
  this user instead of root.
- Healthcheck via the image's `healthcheck.sh --connect --innodb_initialized`.
- `glpi` depends on `glpi-db` with `condition: service_healthy`.
- Expose ports only to `127.0.0.1` (Nginx will proxy in production).
- `restart: unless-stopped` and an explicit `container_name` on each service.

### Consequences

- **Positive**
  - GLPI configuration, data, logs and plugins survive container recreation.
  - GLPI only starts once MariaDB is genuinely ready, avoiding first-boot races.
  - A non-root database account is available for the API connection string.
- **Negative / mitigations**
  - Existing volumes created with the old 9.x paths must be removed/recreated;
    no production data exists yet, so this is a clean migration.

### References

- Image documentation: <https://hub.docker.com/r/glpi/glpi>
- Source repository: <https://github.com/glpi-project/docker-images>
