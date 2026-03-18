#!/bin/sh
set -eu

CONFIG_DIR="${SESSION_CONFIG_DIR:-/app/data/config}"
SECRET_FILE="${SESSION_SECRET_FILE:-$CONFIG_DIR/session.env}"

mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

if [ -n "${SESSION_SECRET:-}" ]; then
  if [ ! -f "$SECRET_FILE" ]; then
    umask 077
    printf 'SESSION_SECRET=%s\n' "$SESSION_SECRET" >"$SECRET_FILE"
  fi
  export SESSION_SECRET
  exit 0
fi

if [ -f "$SECRET_FILE" ]; then
  # shellcheck disable=SC1090
  . "$SECRET_FILE"
  if [ -z "${SESSION_SECRET:-}" ]; then
    echo "[blackvault] SESSION_SECRET file exists but is invalid: $SECRET_FILE" >&2
    exit 1
  fi
  export SESSION_SECRET
  exit 0
fi

if command -v openssl >/dev/null 2>&1; then
  GENERATED_SECRET="$(openssl rand -hex 32)"
else
  GENERATED_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fi

umask 077
printf 'SESSION_SECRET=%s\n' "$GENERATED_SECRET" >"$SECRET_FILE"
export SESSION_SECRET="$GENERATED_SECRET"
echo "[blackvault] Generated persistent SESSION_SECRET at $SECRET_FILE"
