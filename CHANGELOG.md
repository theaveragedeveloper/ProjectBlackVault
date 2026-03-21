# Changelog

## 2026-03-20 - V1 Launch Hardening

### Added

- Added runtime configuration validation for startup-critical environment variables.
- Added structured health checks for runtime config + database connectivity.
- Added CI workflow (`.github/workflows/ci.yml`) with lint, typecheck, tests, Prisma checks, and build.
- Added release/support/security docs:
  - `V1_RELEASE_PLAN.md`
  - `NON_TECHNICAL_INSTALL.md`
  - `SHORT_SUPPORT_PLAYBOOK.md`
  - `RELEASE_CHECKLIST.md`
  - `MANUAL_SMOKE_TEST.md`
  - `RELEASE_PROCESS.md`
  - `RELEASE_NOTES_V1.md`
  - `GO_NO_GO.md`
  - `SECURITY_AND_DATA_SAFETY.md`

### Changed

- Renamed package metadata from temporary values to release values (`projectblackvault`, `1.0.0`).
- Hardened install/update scripts for non-technical reliability and safer defaults.
- Improved Docker workflow with tag support and multi-arch publish.
- Updated README quick links and ChatGPT-assisted install section naming.
- Tightened Docker-first doc consistency across README/install/support/release decision files.
- Upgraded `next` and `eslint-config-next` to `16.2.0`.
- Removed duplicate `tsx` entry from `package.json` devDependencies.

### Fixed

- Removed stale duplicate API route file `src/app/api/builds/[id]/slots/route 2.ts`.
- Fixed lint noise from backup artifact directories.
- Fixed setup password policy mismatch between UI and backend.
- Cleared dependency audit findings via `npm audit fix` (current audit baseline: 0 vulnerabilities).

## 2026-03-19 - V1 Public Release Prep

### Fixed

- Fixed duplicate navigation chrome by disabling app shell navigation on the `/login` route.
- Fixed broken build navigation link from accessory detail pages to the correct firearm build route.
- Improved image picker reliability:
  - Syncs preview state when the current image URL changes
  - Handles non-JSON upload errors safely
  - Adds URL validation and clearer error handling
- Added authenticated uploaded-image serving route at `/uploads/[...path]` so newly uploaded files render in production.

### Docker / Release

- Switched main compose file to build from local source for release consistency.
- Aligned upload persistence path to `/app/uploads` and set `IMAGE_UPLOAD_DIR` in Docker runtime.
- Updated development compose path mappings to match runtime behavior.
- Fixed Docker healthcheck to use `127.0.0.1` so containers become healthy reliably.
- Simplified and corrected Docker-only README and `.env.example` guidance.
