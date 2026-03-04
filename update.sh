#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║   BlackVault — Update Script         ║"
echo "╚══════════════════════════════════════╝"
echo ""

echo "Pulling latest BlackVault image from registry..."
docker compose pull

echo ""
echo "Restarting with updated image..."
docker compose up -d

echo ""
echo "Waiting for health check..."
sleep 5

if docker compose ps | grep -q "healthy\|running"; then
  echo "BlackVault is running and healthy."
else
  echo "Container started — check logs with: docker compose logs -f"
fi

echo ""
echo "Update complete."
