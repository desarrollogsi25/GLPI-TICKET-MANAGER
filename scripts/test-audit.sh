#!/usr/bin/env bash
# Smoke test: verifica que claim y resolve registran auditoría en audit_log.
# Uso: ejecutar después de seed-e2e.sh (ticket #11 debe estar libre).

set -euo pipefail

API="http://localhost:8080"

echo "=== 1. Login as tech1 ==="
LOGIN=$(curl -sf -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"tech1","password":"Tech1Pass!"}')
TOKEN=$(echo "$LOGIN" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "ERROR: could not login"
  exit 1
fi
echo "Login OK"

# Limpiar audit_log para empezar desde cero
echo "=== 2. Cleanup audit_log for user 7 ==="
docker compose exec -T app-db psql -U app -d glpi_ticket_manager -c \
  "DELETE FROM audit_log WHERE user_id = 7;" > /dev/null

echo "=== 3. Claim ticket #11 ==="
CLAIM=$(curl -sf -X POST "$API/api/tickets/11/claim" \
  -H "Authorization: Bearer $TOKEN")
echo "Claim OK: $(echo "$CLAIM" | head -c 100)"

# Verificar en BD
CLAIM_COUNT=$(docker compose exec -T app-db psql -U app -d glpi_ticket_manager -tAc \
  "SELECT COUNT(*) FROM audit_log WHERE user_id=7 AND action='claim' AND ticket_id=11;")
if [ "$CLAIM_COUNT" != "1" ]; then
  echo "ERROR: expected 1 claim audit entry, found $CLAIM_COUNT"
  exit 1
fi
echo "Audit 'claim' verified (1 entry)"

echo "=== 4. Create solution ==="
curl -sf -X POST "$API/api/tickets/11/solutions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Audit smoke test solution"}' > /dev/null
echo "Solution created"

echo "=== 5. Resolve ticket (PATCH status=5) ==="
HTTP=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$API/api/tickets/11/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":5}')
if [ "$HTTP" != "204" ] && [ "$HTTP" != "200" ]; then
  echo "ERROR: expected 204/200 on resolve, got $HTTP"
  exit 1
fi
echo "Resolve OK ($HTTP)"

# Verificar en BD
RESOLVE_COUNT=$(docker compose exec -T app-db psql -U app -d glpi_ticket_manager -tAc \
  "SELECT COUNT(*) FROM audit_log WHERE user_id=7 AND action='resolve' AND ticket_id=11;")
if [ "$RESOLVE_COUNT" != "1" ]; then
  echo "ERROR: expected 1 resolve audit entry, found $RESOLVE_COUNT"
  exit 1
fi
echo "Audit 'resolve' verified (1 entry)"

echo ""
echo "=== AUDIT SMOKE TEST PASSED ==="
