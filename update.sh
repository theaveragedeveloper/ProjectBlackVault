#!/bin/bash
set -e

echo "╔══════════════════════════════════════╗"
echo "║   BlackVault — Update Script         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Docker compose v1/v2 detection ────────────────────────────
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif docker-compose version &>/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "ERROR: Docker with Compose is required."
  exit 1
fi

# ── Migrate .blackvault.env → .env ────────────────────────────
if [ ! -f ".env" ] && [ -f ".blackvault.env" ]; then
  echo "Migrating .blackvault.env to .env (one-time)..."
  cp .blackvault.env .env
  echo "Done. .blackvault.env kept as backup."
  echo ""
fi

# ── Check for .env at all ─────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "⚠  No .env file found. BlackVault may not be configured."
  echo "   If this is a fresh clone, run ./install.sh first."
  echo "   Continuing with Docker defaults (DATA_DIR=./data)..."
  echo ""
fi

# ── Read DATA_DIR from .env ────────────────────────────────────
ACTIVE_DATA_DIR=""
if [ -f ".env" ]; then
  ACTIVE_DATA_DIR=$(grep "^DATA_DIR=" .env | cut -d'=' -f2- | tr -d '[:space:]')
fi

# ── Preflight: verify the database exists ─────────────────────
if [ -n "$ACTIVE_DATA_DIR" ]; then
  DB_PATH="$ACTIVE_DATA_DIR/db/vault.db"
  if [ ! -f "$DB_PATH" ]; then
    echo "⚠  WARNING: No database found at expected location:"
    echo "   $DB_PATH"
    echo ""
    # Check legacy locations
    LEGACY_DB=""
    if [ -f "./data/db/vault.db" ]; then
      LEGACY_DB="$(pwd)/data/db/vault.db"
    elif [ -f "$HOME/.blackvault/db/vault.db" ]; then
      LEGACY_DB="$HOME/.blackvault/db/vault.db"
    fi
    if [ -n "$LEGACY_DB" ]; then
      echo "   However, data was found at: $LEGACY_DB"
      echo "   Your .env DATA_DIR may be pointing to the wrong location."
      echo ""
      echo "   To fix: update DATA_DIR in .env to the correct path, then re-run update.sh"
      echo "   OR:      run install.sh to reconfigure (it will detect your existing data)"
      exit 1
    else
      echo "   No existing database found in any known location."
      echo "   This may be a fresh install — continuing."
    fi
  else
    echo "Database verified at: $DB_PATH"
  fi
fi

echo ""

# ── Pull latest code ──────────────────────────────────────────
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Pulling latest updates from GitHub..."
  git pull
  echo ""
fi

# ── Rebuild and restart ───────────────────────────────────────
echo "Rebuilding BlackVault image..."
$COMPOSE build --pull

echo ""
echo "Restarting..."
$COMPOSE up -d

echo ""
echo "Waiting for health check..."
sleep 5

if $COMPOSE ps | grep -q "healthy\|running"; then
  STATUS="running"
else
  STATUS="started (check logs if app doesn't load)"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Update complete.                   ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "  Status:   $STATUS"
if [ -n "$ACTIVE_DATA_DIR" ]; then
  echo "  Data:     $ACTIVE_DATA_DIR"
fi
echo "  URL:      http://localhost:${PORT:-3000}"
echo ""
echo "  To check logs: $COMPOSE logs -f"
echo ""
