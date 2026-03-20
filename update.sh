#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║   BlackVault — Update Script         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Pull latest source via git ────────────────────────────────
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Pulling latest source code..."
  git pull
  echo ""
else
  echo "WARNING: This directory is not a git repository."
  echo "         Skipping 'git pull'. Please download or copy the latest source"
  echo "         files manually before updating."
  echo ""
fi

# ── Require .blackvault.env ───────────────────────────────────
if [ ! -f ".blackvault.env" ]; then
  echo "ERROR: .blackvault.env not found."
  echo "       Run ./install.sh first to create your configuration."
  exit 1
fi

echo "Using config from .blackvault.env"

# Load PORT and DATA_DIR for display in error messages
PORT=$(grep '^PORT=' .blackvault.env | cut -d'=' -f2-)
DATA_DIR=$(grep '^DATA_DIR=' .blackvault.env | cut -d'=' -f2-)

# ── Prefer 'docker compose' (v2) over legacy 'docker-compose' ─
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
else
  COMPOSE="docker-compose"
fi

# ── Pre-flight: Docker daemon running ────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "ERROR: Docker Desktop is not running."
  echo "       Please open Docker Desktop and wait for it to start, then re-run this script."
  exit 1
fi

# ── [1/3] Build updated image ─────────────────────────────────
echo ""
echo "[1/3] Building updated BlackVault image (this takes a few minutes)..."
$COMPOSE --env-file .blackvault.env build

# ── [2/3] Restart with new image ──────────────────────────────
echo ""
echo "[2/3] Restarting BlackVault with the updated image..."
$COMPOSE --env-file .blackvault.env up -d

# ── [3/3] Wait for healthy status (up to 90 s) ───────────────
echo ""
echo "[3/3] Waiting for BlackVault to start (up to 90 seconds)..."

_fail_with_logs() {
  local reason="$1"
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  ERROR: $reason"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Container logs:"
  echo "───────────────────────────────────────────────────────────"
  $COMPOSE --env-file .blackvault.env logs --tail=60
  echo "───────────────────────────────────────────────────────────"
  echo ""
  echo "  Common causes:"
  echo "    - Database migration failed (search logs above for 'Error')"
  echo "    - Port $PORT already in use by another process"
  echo "    - Insufficient disk space or permissions in $DATA_DIR"
  echo ""
  echo "  To roll back, restore a previous backup of $DATA_DIR"
  echo "  or check the logs above for a specific error."
  exit 1
}

ATTEMPTS=0
MAX_ATTEMPTS=45   # 45 × 2 s = 90 s

while true; do
  PS_OUT=$($COMPOSE --env-file .blackvault.env ps 2>/dev/null)

  if echo "$PS_OUT" | grep -q "(healthy)"; then
    echo ""
    echo "BlackVault is healthy."
    break
  fi

  # Fail fast on crash-loop or clean exit with error
  if echo "$PS_OUT" | grep -qE "Restarting|Exit [^0]|exited \([^0]\)"; then
    _fail_with_logs "BlackVault failed to start after update (crash loop detected)"
  fi

  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    _fail_with_logs "BlackVault did not become healthy within 90 seconds"
  fi

  printf "."
  sleep 2
done

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Update complete! BlackVault is running.                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  URL:         http://localhost:$PORT"
echo ""
echo "  To stop BlackVault:"
echo "    $COMPOSE --env-file .blackvault.env down"
echo ""
