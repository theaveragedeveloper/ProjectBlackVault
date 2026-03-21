# FINAL_V1_STATUS.md

## ProjectBlackVault V1 Docker-First Release Status

Date: `2026-03-20`
Branch/Worktree: `V1-Public-release-check`

## Scope Confirmation

- Public V1 install path: Docker-only (home server / on-prem)
- Desktop/downloader/installer path: deferred and out-of-scope for public V1 support
- Legacy helper scripts retained for compatibility only (not primary docs/support path)

## Validation Completed In This Final Pass

- Branch/worktree verified with `git rev-parse --abbrev-ref HEAD` and `git worktree list`.
- `origin/main` was merged into `V1-Public-release-check` and all merge conflicts were resolved with V1 Docker-first behavior preserved.
- `npm run release:check` passed (lint, typecheck, tests, production build).
- Docker runtime sanity check passed:
  - `docker compose up -d --build`
  - startup logs include mode + migration + final startup line
  - `curl -fsS http://localhost:3000/api/health` returned `status: "ok"`
- Dependency baseline tightened:
  - upgraded `next` and `eslint-config-next` to `16.2.0`,
  - ran `npm audit fix`,
  - `npm audit` now returns 0 vulnerabilities.
- Release/install/support docs tightened for Docker-first consistency.
- Manifest cleanup completed (`package.json` duplicate `tsx` devDependency removed).

## Known Remaining Risks (V1)

- Login rate limiting remains in-memory (single-instance behavior, resets on restart).
- No one-click restore wizard (operator-managed backup/restore).
- If users expose app beyond trusted LAN without HTTPS/reverse proxy, session risk remains.
- Next.js build shows a non-blocking Turbopack warning about broad file tracing via `src/app/api/system-info/route.ts` import path behavior.

## Merge Risk Delta (This Run)

- No new release-blocking risk was introduced by this merge resolution pass.
- Existing V1 recommendation remains unchanged: complete manual gates before GO.

## Remaining Manual Gates

- Run full `MANUAL_SMOKE_TEST.md` (sections A-I) on the final release candidate commit.
- Confirm CI and Docker publish workflow are green on the tagged commit.
- Complete and sign off `GO_NO_GO.md` with maintainer name/timestamp.

## Current Recommendation

- **NO-GO (temporary)** until remaining manual gates above are completed.
- Expected outcome after those gates: **GO** for Docker-first V1.
