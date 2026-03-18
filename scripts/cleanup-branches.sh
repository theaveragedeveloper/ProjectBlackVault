#!/bin/bash
# Cleanup script for merged branches
# Generated: 2026-03-15
# All branches listed below have 0 unmerged commits vs main and are safe to delete.

set -e

BRANCHES=(
  "claude/debug-app-loading-HBACb"
  "claude/fix-bugs-improve-readme-96MoB"
  "codex/add-battery-usage-checkbox-for-accessories"
  "codex/fix-settings-update-error"
  "codex/implement-system-update-capability-logic"
  "codex/refactor-date-handling-in-range-sessions-api"
  "codex/refactor-middleware-into-proxy-file"
  "codex/refine-generatedistancerows-for-floating-point-accuracy"
  "codex/tighten-protocol-validation-in-istrustedexternalimageurl"
  "codex/update-session-cookie-settings-in-auth-routes"
)

echo "Deleting ${#BRANCHES[@]} merged remote branches..."
for branch in "${BRANCHES[@]}"; do
  git push origin --delete "$branch" && echo "  Deleted: $branch" || echo "  Failed:  $branch"
done

echo "Done."
