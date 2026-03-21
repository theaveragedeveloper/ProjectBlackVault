# RELEASE_CHECKLIST.md

## Pre-Release
- [ ] Confirm current branch is `V1-Public-release-check`.
- [ ] Confirm `package.json` version is the intended release version.
- [ ] Review `CHANGELOG.md` and `RELEASE_NOTES_V1.md`.
- [ ] Run:
```bash
npm ci
npm run release:check
npm audit --omit=dev
```
- [ ] Confirm docs are current and Docker-first:
  - [ ] `README.md`
  - [ ] `NON_TECHNICAL_INSTALL.md`
  - [ ] `CHATGPT_INSTALL_PROMPTS.md`
  - [ ] `SCREENSHOT_CAPTURE_PLAN.md`
  - [ ] `MANUAL_SMOKE_TEST.md`
  - [ ] `RELEASE_PROCESS.md`
  - [ ] `RELEASE_NOTES_V1.md`
- [ ] Confirm public messaging states Docker-only V1 support.

## Docker / Runtime
- [ ] Build and run locally:
```bash
docker compose up -d --build
```
- [ ] Confirm startup logs are clear and actionable:
```bash
docker compose logs --tail=120 blackvault
```
  - [ ] Includes migration step
  - [ ] Includes final startup line with active port
  - [ ] Includes local-only vs LAN mode line
- [ ] Confirm health endpoint returns `status: "ok"`:
```bash
curl -fsS http://localhost:3000/api/health
```
- [ ] If health is not `ok`, confirm `startupHints` explains next action.
- [ ] Confirm first-run setup appears on clean data.
- [ ] Confirm login works after setup.
- [ ] Confirm empty-password login/setup shows plain-English validation message.
- [ ] Confirm upload + export paths work.
- [ ] Confirm default bind mode is local-only unless `BIND_ADDRESS=0.0.0.0` is set.

## Security / Data Safety
- [ ] `ALLOW_ENCRYPTION_KEY_EXPORT` default is `false`.
- [ ] Session cookie secure mode is `auto` (or stricter if behind HTTPS).
- [ ] `.env` is ignored in git.
- [ ] Backup guidance included in release docs.

## CI / Release Automation
- [ ] CI workflow passes on target commit.
- [ ] Docker workflow can publish tags and latest.
- [ ] Required GH secrets are present (see `RELEASE_PROCESS.md`).

## Publish
- [ ] Tag release commit:
```bash
git tag v1.0.0
git push origin v1.0.0
```
- [ ] Create GitHub release notes from `RELEASE_NOTES_V1.md`.
- [ ] Verify GHCR image tags were published.

## Post-Publish
- [ ] Perform manual smoke test from published artifact.
- [ ] Watch first support tickets for install or setup issues.
- [ ] Update `GO_NO_GO.md` with final decision and timestamp.

## Optional Legacy Script Check (Compatibility Only)
- [ ] If shipping helper scripts, quickly verify:
  - [ ] `install.sh`
  - [ ] `install.bat`
  - [ ] `update.sh`
  - [ ] `update.bat`
