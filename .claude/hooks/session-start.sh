#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

# Install npm dependencies
npm install

# Set up .env if it doesn't exist
if [ ! -f .env ]; then
  echo 'DATABASE_URL="file:./prisma/dev.db"' > .env
fi

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
