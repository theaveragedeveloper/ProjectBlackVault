#!/bin/sh
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " BlackVault — Starting up"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Bootstrap session secret (generates and persists SESSION_SECRET if not set)
if [ -f "./scripts/bootstrap-session-secret.sh" ]; then
  . ./scripts/bootstrap-session-secret.sh
fi

echo "[1/2] Running database migrations..."
node /app/node_modules/prisma/build/index.js migrate deploy
echo "      Migrations complete."

echo "[2/2] Starting server..."
exec node /app/server.js
