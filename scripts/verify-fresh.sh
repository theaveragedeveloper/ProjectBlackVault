#!/usr/bin/env bash
# verify-fresh.sh
# Proves that Prisma migrations apply cleanly on a brand-new empty database.
# Deletes any leftover test DB, runs migrate deploy, checks table count, then cleans up.
# Usage: npm run verify:fresh
set -e

DB=/tmp/pbv-fresh-verify.db
rm -f "$DB"

echo "→ Running prisma migrate deploy on empty database..."
DATABASE_URL="file:$DB" npx prisma migrate deploy

echo "→ Checking tables..."
TABLE_COUNT=$(sqlite3 "$DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE '_prisma%';" 2>/dev/null || echo "0")

rm -f "$DB"

if [ "$TABLE_COUNT" -ge 20 ]; then
  echo "✓ Fresh migration succeeded — $TABLE_COUNT tables created."
else
  echo "✗ Migration failed or incomplete — only $TABLE_COUNT tables found (expected ≥20)."
  exit 1
fi
