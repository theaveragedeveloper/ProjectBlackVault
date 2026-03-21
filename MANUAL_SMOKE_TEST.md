# MANUAL_SMOKE_TEST.md

Run this before publishing V1.

## Test Setup
1. Use a clean data folder (no previous database).
2. Start app:
```bash
docker compose up -d --build
```
3. Open `http://localhost:3000`.
4. Check container startup logs:
```bash
docker compose logs --tail=120 blackvault
```
5. Confirm startup logs clearly show:
  - mode (local-only or LAN enabled),
  - migration step,
  - final server start line.

## A) First-Run Setup
1. Confirm setup screen appears.
2. Enter a password with fewer than 8 characters.
3. Confirm setup is blocked with a clear message.
4. Enter only spaces as password.
5. Confirm setup is blocked with a clear message.
6. Enter a valid password and submit.
7. Confirm redirect into app.

Expected:
- Setup appears only once per data folder.
- Successful setup creates a persistent login state.

## B) Login / Session
1. Log out.
2. Log in with wrong password.
3. Confirm plain-English error.
4. Submit empty password.
5. Confirm plain-English validation message.
6. Log in with correct password.
7. Confirm dashboard loads.

## C) Health + Startup Validation
1. Run:
```bash
curl -fsS http://localhost:3000/api/health
```
2. Confirm:
  - `status` is `ok`
  - `checks.config.ok` is `true`
  - `checks.database.ok` is `true`
  - `summary` indicates checks passed
  - `startupHints` is empty (or only informational)

## D) Persistence
1. Add one firearm.
2. Add one accessory.
3. Restart container:
```bash
docker compose restart
```
4. Confirm records still exist.

## E) Upload + Export
1. Upload one image and one document.
2. Open uploaded file URL from app UI.
3. Export data in JSON and CSV from Settings.
4. Confirm files download and contain expected content.

## F) Backup/Recovery Sanity
1. Confirm folders exist:
  - `./data/db`
  - `./data/uploads`
2. Confirm `.env` exists if custom settings are in use.

## G) Update Path (Docker Compose)
1. Rebuild/update runtime:
```bash
docker compose up -d --build
```
2. Confirm app returns healthy.
3. Confirm data remains intact.

## H) Failure Message Check
1. Temporarily set invalid `VAULT_ENCRYPTION_KEY` in env.
2. Restart.
3. Confirm startup fails with clear reason in logs.
4. Revert and confirm healthy startup.

## I) LAN Toggle Sanity
1. With default env, confirm app works on `localhost` only.
2. Set `BIND_ADDRESS=0.0.0.0` and restart.
3. Confirm app loads from another device on the same network.
4. Revert to local-only if LAN access is not required.

## Pass Criteria
- All sections A-I pass.
- No data loss in restart/update flow.
- No blocker-level errors in logs after normal use.
