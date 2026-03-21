#!/bin/sh
set -eu

log() {
  printf '[startup] %s\n' "$1"
}

fail() {
  printf '[startup] ERROR: %s\n' "$1" >&2
  exit 1
}

PORT_VALUE="${PORT:-3000}"
BIND_ADDRESS_VALUE="${BIND_ADDRESS:-127.0.0.1}"
SESSION_SECRET_FILE="${SESSION_SECRET_FILE:-/app/data/session-secret}"
ALLOW_EXPORT_VALUE="$(printf '%s' "${ALLOW_ENCRYPTION_KEY_EXPORT:-false}" | tr '[:upper:]' '[:lower:]')"

case "$PORT_VALUE" in
  ''|*[!0-9]*)
    fail "PORT must be a number between 1 and 65535. Current value: ${PORT_VALUE:-<empty>}"
    ;;
esac

if [ "$PORT_VALUE" -lt 1 ] || [ "$PORT_VALUE" -gt 65535 ]; then
  fail "PORT must be a number between 1 and 65535. Current value: $PORT_VALUE"
fi

if [ -z "${SESSION_SECRET:-}" ]; then
  if [ -f "$SESSION_SECRET_FILE" ]; then
    SESSION_SECRET="$(tr -d '\r\n' < "$SESSION_SECRET_FILE")"
    log "Loaded existing SESSION_SECRET from $SESSION_SECRET_FILE."
  fi

  if [ -z "${SESSION_SECRET:-}" ] || [ "${#SESSION_SECRET}" -lt 32 ]; then
    log "Generating persistent SESSION_SECRET at $SESSION_SECRET_FILE."
    mkdir -p "$(dirname "$SESSION_SECRET_FILE")"
    umask 077
    SESSION_SECRET="$(openssl rand -hex 64)"
    printf '%s' "$SESSION_SECRET" > "$SESSION_SECRET_FILE"
    chmod 600 "$SESSION_SECRET_FILE"
  fi

  export SESSION_SECRET
else
  log "Using SESSION_SECRET from environment override."
fi

if [ "${#SESSION_SECRET}" -lt 32 ]; then
  fail "SESSION_SECRET must be at least 32 characters."
fi

if [ -n "${VAULT_ENCRYPTION_KEY:-}" ] && ! printf '%s' "$VAULT_ENCRYPTION_KEY" | grep -Eq '^[0-9a-fA-F]{64}$'; then
  fail "VAULT_ENCRYPTION_KEY must be exactly 64 hex characters."
fi

if [ "$ALLOW_EXPORT_VALUE" != "true" ] && [ "$ALLOW_EXPORT_VALUE" != "false" ]; then
  fail "ALLOW_ENCRYPTION_KEY_EXPORT must be true or false."
fi

if [ "$BIND_ADDRESS_VALUE" = "0.0.0.0" ]; then
  log "Network access is enabled (BIND_ADDRESS=0.0.0.0)."
else
  log "Local-only mode enabled (BIND_ADDRESS=$BIND_ADDRESS_VALUE)."
fi

log "Running Prisma migrations..."
if ! node ./node_modules/prisma/build/index.js migrate deploy; then
  fail "Database migration failed. Check Docker volume permissions and DATABASE_URL."
fi

log "Starting ProjectBlackVault on port $PORT_VALUE..."
exec node server.js
