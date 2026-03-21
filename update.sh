#!/bin/bash
set -euo pipefail

echo "╔══════════════════════════════════════╗"
echo "║ ProjectBlackVault Update Script      ║"
echo "╚══════════════════════════════════════╝"
echo ""

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif docker-compose version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: Docker Compose is required."
  echo "Install or update Docker Desktop, then retry."
  exit 1
fi

ENV_ARGS=""
PORT=3000
if [ -f ".blackvault.env" ]; then
  ENV_ARGS="--env-file .blackvault.env"
  echo "Using config from .blackvault.env"
  PORT="$(grep '^PORT=' .blackvault.env 2>/dev/null | cut -d= -f2 || true)"
  PORT="${PORT:-3000}"
fi

health_check() {
  local url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "$url" 2>/dev/null | grep -q '"status":"ok"'
    return $?
  fi
  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$url" 2>/dev/null | grep -q '"status":"ok"'
    return $?
  fi
  return 1
}

echo "Trying to pull latest image..."
if ! $COMPOSE $ENV_ARGS pull; then
  echo "Image pull failed or skipped. Continuing with local build."
fi

echo ""
echo "Restarting ProjectBlackVault..."
$COMPOSE $ENV_ARGS up -d --build --remove-orphans

echo ""
echo "Checking health..."
MAX_RETRIES=45
for i in $(seq 1 "$MAX_RETRIES"); do
  if health_check "http://localhost:${PORT}/api/health"; then
    echo "ProjectBlackVault is running and healthy."
    echo ""
    echo "Update complete."
    exit 0
  fi
  sleep 2
done

echo "ProjectBlackVault is still starting."
echo "Check logs with:"
echo "  $COMPOSE $ENV_ARGS logs -f"
echo ""
echo "Update command finished, but health was not confirmed yet."
