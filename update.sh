#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║   BlackVault — Update Script         ║"
echo "╚══════════════════════════════════════╝"
echo ""

ENV_ARGS=""
if [ -f ".blackvault.env" ]; then
  ENV_ARGS="--env-file .blackvault.env"
  echo "Using config from .blackvault.env"
fi

echo "Pulling latest BlackVault image from registry..."
docker compose $ENV_ARGS pull

echo ""
echo "Restarting with updated image..."
docker compose $ENV_ARGS up -d

echo ""
PORT=$(grep '^PORT=' .blackvault.env 2>/dev/null | cut -d= -f2)
PORT="${PORT:-3000}"
echo "Waiting for BlackVault to be ready..."
MAX_RETRIES=15
for i in $(seq 1 $MAX_RETRIES); do
  if wget -qO- "http://localhost:${PORT}/api/health" 2>/dev/null | grep -q '"ok"'; then
    echo "BlackVault is running and healthy."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "Still starting — check logs with: docker compose $ENV_ARGS logs -f"
  else
    sleep 2
  fi
done

echo ""
echo "Update complete."
