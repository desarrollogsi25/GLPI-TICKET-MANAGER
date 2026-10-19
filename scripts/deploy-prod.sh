#!/usr/bin/env bash
# =============================================================================
# Production Deployment Script - GLPI Ticket Manager (H-19)
# Reference: ISO 27001 A.12.1.2 & ISO 9001 Operation Control
# =============================================================================
set -euo pipefail

ENV_FILE=".env.prod"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=========================================================="
echo " Starting GLPI Ticket Manager Production Deployment (H-19)"
echo "=========================================================="

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[-] ERROR: Production environment file '$ENV_FILE' not found."
  echo "    Please create it from '.env.prod.example' before deploying."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[-] ERROR: Compose file '$COMPOSE_FILE' not found."
  exit 1
fi

echo "[+] Sourcing environment configuration from $ENV_FILE..."
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

PORT="${PROD_HTTP_PORT:-80}"
HEALTH_URL="http://127.0.0.1:${PORT}/health"

echo "[+] Building and starting production containers..."
if docker compose version >/dev/null 2>&1; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
else
  docker-compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build
fi

echo "[+] Waiting for application services to become healthy..."
MAX_RETRIES=30
RETRY_COUNT=0
HEALTHY=false

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
  if curl -s -f "$HEALTH_URL" >/dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "    Attempt $RETRY_COUNT/$MAX_RETRIES: waiting for $HEALTH_URL..."
  sleep 2
done

if [[ "$HEALTHY" = true ]]; then
  echo "[+] SUCCESS: GLPI Ticket Manager is UP and HEALTHY at http://127.0.0.1:${PORT}"
  echo "=========================================================="
  exit 0
else
  echo "[-] ERROR: Health probe timed out at $HEALTH_URL after $((MAX_RETRIES * 2)) seconds."
  echo "[-] Displaying recent logs for diagnosis:"
  if docker compose version >/dev/null 2>&1; then
    docker compose -f "$COMPOSE_FILE" logs --tail 50
  else
    docker-compose -f "$COMPOSE_FILE" logs --tail 50
  fi
  exit 1
fi
