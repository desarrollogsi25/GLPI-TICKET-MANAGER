#!/usr/bin/env bash
# Verifica que main tenga branch protection configurada

REPO="desarrollogsi25/GLPI-TICKET-MANAGER"
PROTECTION=$(gh api "repos/${REPO}/branches/main/protection" 2>&1)

if echo "$PROTECTION" | grep -q "Branch not protected"; then
    echo "ERROR: main is not protected"
    exit 1
fi

# Verificar checks requeridos
REQUIRED=$(echo "$PROTECTION" | jq -r '.required_status_checks.contexts[]' 2>/dev/null)
echo "Required checks:"
echo "$REQUIRED"

for check in "secret-scan" "backend" "frontend" "e2e"; do
    if ! echo "$REQUIRED" | grep -q "$check"; then
        echo "WARNING: check '$check' not required"
    fi
done
