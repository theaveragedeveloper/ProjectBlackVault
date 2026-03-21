# V1 Release Plan (ProjectBlackVault)

## Branch/Worktree Source Of Truth
- Verified branch/worktree used for this pass: `V1-Public-release-check`
- Local repository path: `/Users/alex/Documents/ProjectBlackVault`
- `V1-Public-release-check` was not present as a pre-existing branch/worktree in this clone.
- To enforce release isolation, a local branch named `V1-Public-release-check` was created from commit `6ed3a063bf1c9a141636e148934c4df2c90e5994` and used as the source of truth.

## 1) Critical Blockers
- No startup/runtime environment validation for production-critical settings.
- Health endpoint did not verify database readiness.
- Install/update scripts were fragile for non-technical users (`wget` dependency, pull-only assumptions, weak recovery guidance).
- Lint process scanned backup build artifacts (`.next.bak.*`) and produced false failures.
- Product metadata was not release-ready (`blackvault-temp`, `0.1.0`).
- Stale duplicate API route file existed: `src/app/api/builds/[id]/slots/route 2.ts`.

## 2) High-Priority Release Tasks
- Add runtime configuration validator and wire into server startup.
- Upgrade `/api/health` to include config + DB checks with actionable output.
- Harden setup/login password validation and user-facing setup errors.
- Standardize package metadata and add a release quality command.
- Add CI workflow with lint/typecheck/tests/build and Prisma migration check.
- Improve Docker publish workflow for tags and multi-arch images.
- Improve install/update scripts (Mac/Linux + Windows) for first-run reliability and safer defaults.

## 3) Medium-Priority Polish
- Add release and support docs for non-technical users:
  - `NON_TECHNICAL_INSTALL.md`
  - `SHORT_SUPPORT_PLAYBOOK.md`
  - `RELEASE_CHECKLIST.md`
  - `MANUAL_SMOKE_TEST.md`
  - `RELEASE_PROCESS.md`
  - `RELEASE_NOTES_V1.md`
  - `GO_NO_GO.md`
  - `SECURITY_AND_DATA_SAFETY.md`
- Align README references to new support/release docs.
- Improve lint ignore scope for local backup artifacts.

## 4) Nice-To-Have Post-V1
- Add authenticated backup import/restore wizard in UI.
- Add session invalidation controls and audit logs.
- Add integration smoke tests with Playwright/Cypress.
- Add signed desktop release artifacts (if Electron release is introduced).

## 5) Remaining Known Risks
- No end-to-end automated UI smoke test yet (manual smoke test remains required).
- In-memory login rate limit resets on restart and is single-instance only.
- SQLite file-level backup/restore remains operator-managed (no one-click restore flow).
- If users expose the app on public networks without reverse proxy HTTPS, cookie/session risk increases.

## 6) Execution Notes
- This plan was created from the audited code currently checked out in `V1-Public-release-check`.
- No assumptions were taken from `main` or other worktrees as source-of-truth code.
