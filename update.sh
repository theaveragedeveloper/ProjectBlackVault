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
echo "Waiting for health check..."
sleep 5

if docker compose $ENV_ARGS ps | grep -q "healthy\|running"; then
  echo "BlackVault is running and healthy."
else
  echo "Container started — check logs with: docker compose $ENV_ARGS logs -f"
fi

echo ""
echo "Update complete."
