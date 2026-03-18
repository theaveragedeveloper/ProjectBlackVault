#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: scripts/refresh-mr-branches.sh [options] <mr-branch> [<mr-branch> ...]

Refresh one or more stale MR branches by replaying them onto the latest target branch.

Options:
  -t, --target <branch>   Target branch to merge/rebase from (default: main)
  -r, --remote <name>     Remote name (default: origin)
  --rebase                Rebase MR branches on top of target branch
  --merge                 Merge target branch into MR branches (default)
  --dry-run               Print planned actions without changing branches
  -h, --help              Show this help message

Examples:
  scripts/refresh-mr-branches.sh feature/alpha feature/bravo
  scripts/refresh-mr-branches.sh --rebase -t develop mr/old-123
USAGE
}

TARGET_BRANCH="main"
REMOTE="origin"
MODE="merge"
DRY_RUN="false"
BRANCHES=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--target)
      TARGET_BRANCH="$2"
      shift 2
      ;;
    -r|--remote)
      REMOTE="$2"
      shift 2
      ;;
    --rebase)
      MODE="rebase"
      shift
      ;;
    --merge)
      MODE="merge"
      shift
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      BRANCHES+=("$1")
      shift
      ;;
  esac
done

if [[ ${#BRANCHES[@]} -eq 0 ]]; then
  echo "❌ No MR branches provided."
  usage
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "❌ This script must run inside a git repository."
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ Working tree is not clean. Commit/stash changes and retry."
  exit 1
fi

START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

echo "ℹ️  Fetching latest refs from $REMOTE..."
run git fetch "$REMOTE"

if ! git show-ref --verify --quiet "refs/remotes/$REMOTE/$TARGET_BRANCH"; then
  echo "❌ Target branch '$TARGET_BRANCH' not found on remote '$REMOTE'."
  exit 1
fi

for branch in "${BRANCHES[@]}"; do
  echo
  echo "▶ Refreshing '$branch' using $MODE against '$REMOTE/$TARGET_BRANCH'"

  if ! git show-ref --verify --quiet "refs/remotes/$REMOTE/$branch"; then
    echo "❌ Remote branch '$REMOTE/$branch' not found. Skipping."
    continue
  fi

  run git checkout -B "$branch" "$REMOTE/$branch"

  if [[ "$MODE" == "rebase" ]]; then
    if run git rebase "$REMOTE/$TARGET_BRANCH"; then
      run git push --force-with-lease "$REMOTE" "$branch"
      echo "✅ Rebased and pushed '$branch'."
    else
      echo "❌ Rebase conflict on '$branch'. Resolve conflicts, then run:"
      echo "   git rebase --continue"
      echo "   git push --force-with-lease $REMOTE $branch"
      exit 1
    fi
  else
    if run git merge --no-edit "$REMOTE/$TARGET_BRANCH"; then
      run git push "$REMOTE" "$branch"
      echo "✅ Merged and pushed '$branch'."
    else
      echo "❌ Merge conflict on '$branch'. Resolve conflicts, then run:"
      echo "   git add <files> && git commit"
      echo "   git push $REMOTE $branch"
      exit 1
    fi
  fi

done

echo
run git checkout "$START_BRANCH"
echo "🏁 Done. Returned to '$START_BRANCH'."
