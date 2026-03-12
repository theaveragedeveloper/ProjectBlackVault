#!/usr/bin/env bash
set -euo pipefail

if rg -n --hidden --no-ignore \
  "^(<<<<<<<|>>>>>>>|\|\|\|\|\|\|\|)( .*)?$" \
  --glob '!.git/**' \
  --glob '!node_modules/**' \
  --glob '!package-lock.json' \
  .; then
  echo "\n❌ Merge conflict markers found. Resolve them before merging."
  exit 1
fi

echo "✅ No unresolved merge conflict markers found."
