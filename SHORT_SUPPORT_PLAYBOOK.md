# SHORT_SUPPORT_PLAYBOOK.md

Use this when helping users quickly.

## 1) First Questions To Ask
1. What OS are you using (Windows/macOS/Linux)?
2. Did you follow Docker-first docs (`.env` + `docker compose ...`) or legacy helper scripts (`.blackvault.env`)?
3. What exact error do you see?
4. Did this ever work on this machine before?
5. Can you share output of:
```bash
docker compose ps
docker compose logs --tail=120
```

## 2) Fast Triage
- Container not running:
  - Ask user to run `docker compose up -d --build`.
- Health check not passing:
  - Check logs for config errors (`DATABASE_URL`, `SESSION_SECRET`, `VAULT_ENCRYPTION_KEY`).
- Login/setup confusion:
  - If setup screen is missing, the vault was already initialized in this data folder.
  - Confirm user is pointing to the correct data folder.
- Port conflict:
  - Re-run install and choose another port.

## 3) Common Errors In Plain English
- `SESSION_SECRET must be at least 32 characters`
  - Their secret is too short. Remove it or set a longer one.
- `VAULT_ENCRYPTION_KEY must be 64 hex characters`
  - Encryption key format is invalid.
- `DATABASE_URL ...`
  - Database location is not set correctly.
- Health endpoint returns `degraded`
  - Startup config or database is not ready.

## 4) Safe Recovery Steps
1. Stop containers:
```bash
docker compose down
```
2. Verify `.env` has correct values (or `.blackvault.env` if using legacy scripts).
3. Start again:
```bash
docker compose up -d --build
```
4. Check health:
```bash
curl -fsS http://localhost:3000/api/health
```

## 5) Data Safety Rules For Support
- Never tell users to delete data until backup is confirmed.
- Always ask them to back up:
  - data folder (`db` + `uploads`)
  - `.env` (and `.blackvault.env` only for legacy script installs)
- Remind: losing encryption key means encrypted fields are unrecoverable.

## 6) Update Problems
- Update script fails to pull:
  - It should continue with local build.
  - Confirm Docker daemon is running.
- After update app won’t start:
  - Check logs, then rollback by re-running previous known-good image tag (if available).

## 7) Escalation Criteria
- Database corruption signs (SQLite file errors).
- Repeated failed migrations.
- Suspected auth bypass/security bug.
- Data loss report.
