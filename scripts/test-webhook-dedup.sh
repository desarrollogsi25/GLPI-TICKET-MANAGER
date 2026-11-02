#!/usr/bin/env bash
# H-02/H-14: concurrent signed replays must create one durable notification.
set -euo pipefail

if [ -z "${GLPI_WEBHOOK_SECRET:-}" ]; then
  echo "ERROR: GLPI_WEBHOOK_SECRET missing" >&2
  exit 1
fi

BODY='{"ticketId":11}'
TIMESTAMP=$(date +%s)
SIGNATURE=$(printf '%s%s' "$BODY" "$TIMESTAMP" | \
  openssl dgst -sha256 -hmac "$GLPI_WEBHOOK_SECRET" -hex | awk '{print $NF}')

OUTPUT_DIR=$(mktemp -d)
trap 'rm -r -- "$OUTPUT_DIR"' EXIT

# Issue overlapping requests: the DB unique key, not a per-process lock or
# a page of ten notifications, must decide who can persist TicketCreated.
for i in $(seq 1 12); do
  curl -sS -o "$OUTPUT_DIR/body-$i" -w '%{http_code}' \
    -X POST http://localhost:8080/api/integrations/glpi/ticket-created \
    -H "Content-Type: application/json" \
    -H "X-GLPI-timestamp: $TIMESTAMP" \
    -H "X-GLPI-signature: $SIGNATURE" \
    --data-binary "$BODY" > "$OUTPUT_DIR/status-$i" &
done
wait

for i in $(seq 1 12); do
  CODE=$(< "$OUTPUT_DIR/status-$i")
  if [ "$CODE" != "200" ]; then
    echo "ERROR: webhook replay $i returned $CODE" >&2
    sed -n '1,5p' "$OUTPUT_DIR/body-$i" >&2
    exit 1
  fi
done

NOTIFICATIONS=$(docker compose exec -T app-db psql -v ON_ERROR_STOP=1 -U app \
  -d glpi_ticket_manager -tAc "SELECT COUNT(*) FROM notifications WHERE user_id=7 AND ticket_id=11 AND type='TicketCreated';")
CLAIMS=$(docker compose exec -T app-db psql -v ON_ERROR_STOP=1 -U app \
  -d glpi_ticket_manager -tAc "SELECT COUNT(*) FROM glpi_ticket_created_notification_keys WHERE user_id=7 AND ticket_id=11;")

if [ "$NOTIFICATIONS" != "1" ] || [ "$CLAIMS" != "1" ]; then
  echo "ERROR: dedup failed (notifications=$NOTIFICATIONS, claims=$CLAIMS; expected one each)" >&2
  exit 1
fi
echo "Webhook H-02/H-14 idempotency smoke passed (12 concurrent retries, 1 notification)."
