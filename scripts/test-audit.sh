#!/usr/bin/env bash
# Smoke test: verifica que claim y resolve registran auditoría en audit_log.
# AUTOCONTENIDO: crea su propio ticket (id=98), no interfiere con otros tests.
# Idempotente: se puede ejecutar N veces sin reset externo.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
GUARD="$SCRIPT_DIR/e2e/guard.mjs"
# Verify before HTTP, SQL or cleanup; no local .env or default Compose target.
API="$(node "$GUARD" url api)"
SMOKE_TICKET_ID=98
SMOKE_USER_ID=7
SMOKE_GROUP_ID=1

psql_app() {
  printf '%s\n' "$1" | node "$GUARD" sql postgres
}

mariadb_glpi() {
  printf '%s\n' "$1" | node "$GUARD" sql mariadb
}

cleanup() {
  mariadb_glpi "
    DELETE FROM glpi_tickets_users WHERE tickets_id=${SMOKE_TICKET_ID};
    DELETE FROM glpi_groups_tickets WHERE tickets_id=${SMOKE_TICKET_ID};
    DELETE FROM glpi_itilsolutions WHERE itemtype='Ticket' AND items_id=${SMOKE_TICKET_ID};
    DELETE FROM glpi_itilfollowups WHERE itemtype='Ticket' AND items_id=${SMOKE_TICKET_ID};
    DELETE FROM glpi_tickets WHERE id=${SMOKE_TICKET_ID};
  " > /dev/null
  
  psql_app "DELETE FROM audit_log WHERE ticket_id=${SMOKE_TICKET_ID};" > /dev/null
}

echo "=== 0. Cleanup any previous smoke ticket ==="
cleanup

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

echo "=== 2. Create smoke ticket #${SMOKE_TICKET_ID} via SQL ==="
mariadb_glpi "
  INSERT INTO glpi_tickets (id, entities_id, name, date, date_mod, status, 
    requesttypes_id, content, urgency, impact, priority, type, global_validation)
  VALUES (${SMOKE_TICKET_ID}, 0, 'audit-smoke-test', NOW(), NOW(), 1, 3, 
    'Audit smoke test ticket', 3, 3, 3, 1, 1);
  INSERT INTO glpi_groups_tickets (tickets_id, groups_id, type) 
  VALUES (${SMOKE_TICKET_ID}, ${SMOKE_GROUP_ID}, 2);
"
echo "Ticket #${SMOKE_TICKET_ID} created"

echo "=== 3. Verify ticket is available (status=1, no assignee) ==="
STATUS=$(mariadb_glpi "SELECT status FROM glpi_tickets WHERE id=${SMOKE_TICKET_ID};" | tail -1 | tr -d ' ')
if [ "$STATUS" != "1" ]; then
  echo "ERROR: ticket status is $STATUS, expected 1"
  exit 1
fi

echo "=== 4. Claim ticket #${SMOKE_TICKET_ID} ==="
CLAIM_HTTP=$(curl -s -o /tmp/claim.json -w "%{http_code}" \
  -X POST "$API/api/tickets/${SMOKE_TICKET_ID}/claim" \
  -H "Authorization: Bearer $TOKEN")
if [ "$CLAIM_HTTP" != "200" ]; then
  echo "ERROR: claim returned $CLAIM_HTTP"
  cat /tmp/claim.json
  cleanup
  exit 1
fi
echo "Claim OK (200)"

CLAIM_COUNT=$(psql_app "SELECT COUNT(*) FROM audit_log WHERE user_id=${SMOKE_USER_ID} AND action='claim' AND ticket_id=${SMOKE_TICKET_ID};")
if [ "$CLAIM_COUNT" != "1" ]; then
  echo "ERROR: expected 1 claim audit entry, found $CLAIM_COUNT"
  cleanup
  exit 1
fi
echo "Audit 'claim' verified (1 entry)"

echo "=== 5. Create solution ==="
curl -sf -X POST "$API/api/tickets/${SMOKE_TICKET_ID}/solutions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Audit smoke test solution"}' > /dev/null
echo "Solution created"

echo "=== 6. Resolve ticket (PATCH status=5) ==="
RESOLVE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "$API/api/tickets/${SMOKE_TICKET_ID}/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":5}')
if [ "$RESOLVE_HTTP" != "204" ] && [ "$RESOLVE_HTTP" != "200" ]; then
  echo "ERROR: expected 204/200 on resolve, got $RESOLVE_HTTP"
  cleanup
  exit 1
fi
echo "Resolve OK ($RESOLVE_HTTP)"

RESOLVE_COUNT=$(psql_app "SELECT COUNT(*) FROM audit_log WHERE user_id=${SMOKE_USER_ID} AND action='resolve' AND ticket_id=${SMOKE_TICKET_ID};")
if [ "$RESOLVE_COUNT" != "1" ]; then
  echo "ERROR: expected 1 resolve audit entry, found $RESOLVE_COUNT"
  cleanup
  exit 1
fi
echo "Audit 'resolve' verified (1 entry)"

echo "=== 7. Cleanup ==="
cleanup
echo "Smoke ticket #${SMOKE_TICKET_ID} removed"

echo ""
echo "=== AUDIT SMOKE TEST PASSED ==="
