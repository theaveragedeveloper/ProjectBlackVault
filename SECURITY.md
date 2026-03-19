# Security Notes (V1)

## What BlackVault Protects

- Login-gated access to app pages, API routes, and uploaded file routes.
- Signed session cookies (`SESSION_SECRET`) for auth integrity.
- Optional at-rest encryption of serial numbers and notes.
- Upload validation for documents/images (allowed types + signature checks).

## What You Must Secure As Operator

- Use HTTPS via reverse proxy before internet exposure.
- Keep `SESSION_SECRET` strong and private.
- Keep host filesystem permissions tight for `${DATA_DIR}`.
- Protect backups of database and uploads.

## Recommended Deployment Defaults

- Keep `BIND_ADDRESS=127.0.0.1` unless you explicitly need remote access.
- Set an app password in Settings.
- Prefer `VAULT_ENCRYPTION_KEY` in environment instead of DB-stored key.
- Keep `ALLOW_ENCRYPTION_KEY_EXPORT=false` unless you have a temporary recovery need.

## Known V1 Limitations

- This is single-factor password protection (no MFA/SSO).
- CSRF tokens are not implemented; app relies on same-site cookie behavior.
- If encryption key is stored in the same DB, DB compromise may also expose the key.
