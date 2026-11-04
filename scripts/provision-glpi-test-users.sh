#!/usr/bin/env bash
# =============================================================================
# Applies the H-39 test-user provisioning only to a confirmed disposable
# E2E fixture. The legacy dev stack is intentionally not a target: see
# scripts/e2e/README.md.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GUARD="$SCRIPT_DIR/e2e/guard.mjs"

node "$GUARD" verify --destructive

echo "Aplicando scripts/provision-glpi-test-users.sql..."
node "$GUARD" sql mariadb < "$SCRIPT_DIR/provision-glpi-test-users.sql"
echo "Provisión aplicada al fixture efímero."
