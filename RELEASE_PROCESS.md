# RELEASE_PROCESS.md

This is the solo-maintainer release flow for V1.

## Public Install Positioning (Required)

- Public V1 install/update support path is Docker Compose.
- Desktop/downloader/installer flows are out-of-scope for public V1 support.
- Release docs must keep Docker-first messaging consistent.

## Docs Consistency Set (Required)

These files must agree on Docker-first V1 scope before tagging:

- `README.md`
- `NON_TECHNICAL_INSTALL.md`
- `RELEASE_NOTES_V1.md`
- `FINAL_V1_STATUS.md`
- `GO_NO_GO.md`

## Version Source Of Truth
- Source of truth: `package.json` -> `version`
- Current target: `1.0.0`
- Tag format: `v<version>` (example: `v1.0.0`)

## Naming Source Of Truth
- npm package name: `projectblackvault`
- Docker image name: `ghcr.io/theaveragedeveloper/projectblackvault`
- Local compose image: `projectblackvault:v1`

## Branch Discipline
1. Work and validate on `V1-Public-release-check`.
2. Merge/rebase as needed (maintainer preference).
3. Release from a commit that passed CI and manual smoke.

## Required Checks Before Tag
```bash
git rev-parse --abbrev-ref HEAD
npm ci
npm run release:check
npm audit --omit=dev
```
and
```bash
docker compose up -d --build
curl -fsS http://localhost:3000/api/health
```
and
```bash
echo "Complete MANUAL_SMOKE_TEST.md sections A-I before tagging."
```

## GitHub Actions Workflows
- `ci.yml`
  - Installs deps, validates runtime config, runs migrations, lint, typecheck, tests, build.
- `docker.yml`
  - Builds and pushes multi-arch Docker images.
  - Triggers on `main`, tags (`v*`), and manual dispatch.

## Release Artifact Tags
- `latest` on default branch publish
- `sha-...` immutable commit-based tag
- `vX.Y.Z` for release tags

## Required GitHub Secrets/Permissions
- `GITHUB_TOKEN` with packages write (provided automatically in Actions).
- Repository settings must allow GHCR publish.

## Release Steps
1. Confirm `RELEASE_CHECKLIST.md` is complete.
2. Confirm user-facing docs clearly state Docker-only V1 support.
3. Update `CHANGELOG.md` and `RELEASE_NOTES_V1.md`.
4. Run and record `GO_NO_GO.md` decision for the release commit.
5. Commit release changes.
6. Tag and push:
```bash
git tag v1.0.0
git push origin v1.0.0
```
7. Wait for `docker.yml` to publish images.
8. Create GitHub release using `RELEASE_NOTES_V1.md`.

## Rollback Plan
1. Re-point users to previous known-good image tag.
2. If needed, rollback app code to previous release tag.
3. Do not run destructive data reset commands for users unless they explicitly approve and have backups.

## Post-Release
- Monitor first 24-48h support volume.
- Track setup failures and unclear error reports.
- Prioritize fixes that affect onboarding, auth, and data safety first.

## Legacy Script Note

Helper scripts can remain in-repo for compatibility, but release decisions and public instructions should be validated against Docker Compose flow first.
