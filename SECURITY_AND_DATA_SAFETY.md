# SECURITY_AND_DATA_SAFETY.md

Practical V1 security and data safety notes for ProjectBlackVault.

## 1) Auth And Setup Safety
- First-run setup is required when no vault password exists.
- Setup now enforces minimum password length (8 chars).
- Login rejects oversized password payloads.
- Login has basic request throttling to reduce brute-force attempts.

## 2) Runtime Secret Validation
- `SESSION_SECRET` (if set manually) must be at least 32 characters.
- If not provided, app generates and persists a secure secret.
- `VAULT_ENCRYPTION_KEY` must be exactly 64 hex characters.
- Invalid runtime settings fail startup early with plain errors.

## 3) Safe Defaults
- Default bind address in env example and scripts is localhost (`127.0.0.1`).
- LAN exposure requires explicit opt-in.
- Encryption key export is disabled by default (`ALLOW_ENCRYPTION_KEY_EXPORT=false`).

## 4) Data Safety
- Persistent data paths:
  - `${DATA_DIR}/db`
  - `${DATA_DIR}/uploads`
- Keep `.env` with backups for Docker-first installs.
- If using legacy helper scripts, also keep `.blackvault.env`.
- Without encryption key, encrypted fields are unrecoverable.

## 5) Backup/Recovery Guidance
- Back up all of:
  - Data folder (`db` + `uploads`)
  - `.env` (and `.blackvault.env` only if legacy scripts are used)
- Test restore on a second environment before relying on backups.
- Do not rotate encryption keys casually on active data.

## 6) Destructive Actions
- Full reset procedures erase user data.
- Support guidance should always require explicit user confirmation before destructive steps.
- Always request backup confirmation first.

## 7) Secret Leakage Prevention
- `.env` and `.blackvault.env` are git-ignored.
- local session-secret files are git-ignored.
- Docs avoid asking users to post raw secrets.

## 8) Remaining V1 Security Risks
- In-memory login rate limit does not persist across restarts.
- No full account recovery flow beyond backups and configuration recovery.
- If app is exposed publicly without TLS/reverse proxy controls, risk increases.

## 9) Recommended Operational Practices
- Keep app on trusted local network when possible.
- If remote access is needed, use HTTPS reverse proxy and access controls.
- Limit host-level access to data directories and backup files.
- Periodically verify restores from backup.
