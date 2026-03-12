# Secure Backup System (Self-Hosted)

## What it does
BlackVault provides two backup paths in **Settings**:

1. **Manual Encrypted Backup** (best for immediate offline backup)
2. **Automatic Backup Checks** (best for continuous protection after data changes)

A setup wizard in Settings walks users through security + backup setup:
- Set app password
- Enable encryption at rest
- Create first encrypted backup
- Enable automatic backup checks

## Manual backup flow (non-technical)
1. Open Settings → Secure System Backup.
2. Enter a passphrase and confirm it.
3. Click **Create Encrypted Backup**.
4. Save the generated `.bvault` file.

The file is encrypted client-side in the browser using:
- **AES-256-GCM**
- **PBKDF2-SHA256** (high iteration count)

## Automatic backups after changes
Automatic checks can be enabled from Settings with a check interval.

How it works:
- UI periodically calls `POST /api/backup/auto`.
- Server computes a change token based on latest `updatedAt` values.
- If token changed since last auto-backup, server writes a new encrypted backup file.
- If no changes occurred, it skips creating another file.

Server requirement:
- Set `AUTO_BACKUP_PASSPHRASE` environment variable.

Output location:
- `./backups/auto-backup-<timestamp>.bvault`

## Included data
The backup payload includes:
- settings
- firearms
- accessories
- builds/build slots
- maintenance records
- range/training records
- ammo + transactions
- document metadata

Optional toggle:
- Include uploaded document files (recommended ON for disaster recovery)

## Security notes
- Backup passphrases are not persisted to the database.
- Manual backup files are encrypted before being saved locally.
- Automatic backup files are encrypted server-side before being written to `./backups`.
- Keep backup passphrases separate from backup files.
- Set a strong `SESSION_SECRET` in production.

## Endpoints
- `POST /api/backup/export`
  - body: `{ "includeDocumentFiles": true | false }`
  - returns raw backup JSON used by the UI before client-side encryption.

- `POST /api/backup/auto`
  - body: `{ "includeDocumentFiles": true | false, "force": boolean }`
  - writes an encrypted backup only when data changed (or when forced).
