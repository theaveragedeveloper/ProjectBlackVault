# ProjectBlackVault

ProjectBlackVault is a self-hosted firearm inventory and range-log application for individual owners and small teams who want a private, local-first record system.

This V1 release is Docker-only.

## What It Does

- Tracks firearms, accessories, builds, and ammo inventory
- Logs range sessions and accessory round counts
- Stores photos for firearms and accessories
- Runs entirely on SQLite with persistent local volumes

## Official Install Method (Docker)

### Prerequisites

- Docker
- Docker Compose plugin (`docker compose`)

### Setup

```bash
cp .env.example .env
```

Update `.env` as needed:

- `PORT` (default `3000`)
- `BIND_ADDRESS` (default `127.0.0.1` for local-only exposure)
- `DATA_DIR` (default `./data`)
- `SESSION_SECRET` (required, minimum 32 characters)
- `SESSION_COOKIE_SECURE` (`auto` by default; set `true` behind HTTPS)
- `VAULT_ENCRYPTION_KEY` (optional)
- `IMAGE_UPLOAD_DIR` (optional, defaults to `/app/uploads` in Docker)
- `ALLOW_ENCRYPTION_KEY_EXPORT` (default `false`)

### Run

```bash
docker compose up -d --build
```

Open: [http://localhost:3000](http://localhost:3000)

### Stop

```bash
docker compose down
```

## Data Persistence

Compose bind mounts:

- `${DATA_DIR}/db` -> `/app/data` (SQLite database)
- `${DATA_DIR}/uploads` -> `/app/uploads` (uploaded images/documents)

## Security Defaults

- App routes and APIs require a signed session cookie after login.
- Container startup fails if `SESSION_SECRET` is missing or shorter than 32 characters.
- Uploaded files are validated by type and signature before storage.
- Exports exclude firearm serial numbers by default.
- Docker publish binding defaults to `127.0.0.1` (not public internet).

## Secure Self-Hosting Checklist

1. Keep `BIND_ADDRESS=127.0.0.1` unless you intentionally publish it.
2. Put BlackVault behind an HTTPS reverse proxy before exposing it remotely.
3. Set a strong app password in Settings.
4. Set `VAULT_ENCRYPTION_KEY` in environment for better key separation.
5. Keep backups of `${DATA_DIR}/db` and `${DATA_DIR}/uploads` in a secure location.
6. Do not commit `.env`, database files, or uploaded files to version control.

## Data Protection Notes (V1)

- Login protects the web UI, APIs, and uploaded file routes.
- Serial numbers and notes can be encrypted at rest.
- If encryption key is stored only in the app database, theft of that same database may still expose the key.
- `VAULT_ENCRYPTION_KEY` via environment is the recommended production model.

## Troubleshooting

- Check container logs:
```bash
docker compose logs -f blackvault
```
- Rebuild after dependency or Dockerfile changes:
```bash
docker compose up -d --build
```
- Verify health endpoint:
```bash
curl http://localhost:3000/api/health
```
