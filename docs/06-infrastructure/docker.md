## Docker Infrastructure

ISO Header: Infrastructure Setup

### GLPI 11 Docker Setup

This document describes the Docker setup for GLPI 11 using MariaDB 10.11.

#### Services

Both services run with `restart: unless-stopped` and an explicit `container_name`.

- **glpi** (`glpi/glpi:11.0`): runs the GLPI application. The web UI is
  published on `127.0.0.1:8081`. It starts only once `glpi-db` is healthy
  (`depends_on: glpi-db: condition: service_healthy`).
- **glpi-db** (`mariadb:10.11`): provides the database for GLPI. The port is
  published on `127.0.0.1:3306` so the API (run on the host) can connect.

#### Volumes

The `glpi/glpi:11.0` image persists its state under **`/var/glpi`** (`config`,
`files`, `logs`, `marketplace`) and its plugins under **`/var/www/glpi/plugins`**
(source: <https://hub.docker.com/r/glpi/glpi> → *Volumes* and *Path configuration*).

The GLPI 9.x paths (`/var/lib/glpi`, `/etc/glpi`, `/var/www/glpi/marketplace`)
are **not** used by the 11.0 image: mounting them would leave the real config and
data directories unpersisted, so a container recreation would lose the install.
See `docs/01-architecture/decisions/ADR-001-glpi-docker-setup.md`.

| Named volume | Container path | Contents |
|---|---|---|
| `glpi-config` | `/var/glpi/config` | GLPI configuration |
| `glpi-files` | `/var/glpi/files` | Application data, uploads |
| `glpi-logs` | `/var/glpi/logs` | Log files |
| `glpi-marketplace` | `/var/glpi/marketplace` | Marketplace plugins |
| `glpi-plugins` | `/var/www/glpi/plugins` | Custom plugins |
| `glpi-db-data` | `/var/lib/mysql` | MariaDB data |

#### Ports

- **8081**: GLPI web UI, exposed only to `127.0.0.1`.
- **3306**: MariaDB, exposed only to `127.0.0.1`, used by the API.

#### Healthcheck

MariaDB uses the image's bundled `healthcheck.sh --connect --innodb_initialized`,
which waits for the server to accept connections **and** for InnoDB to be ready.
GLPI waits for this healthy state before starting.

#### Environment

`.env` (copy of `.env.example`) provides the database credentials:

- `MARIADB_ROOT_PASSWORD`
- `MARIADB_DATABASE` (`glpi`)
- `MARIADB_USER` (`glpi`) — also used by the API connection string
- `MARIADB_PASSWORD`
