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
- `DATA_DIR` (default `./data`)
- `SESSION_SECRET` (strongly recommended for public exposure)
- `VAULT_ENCRYPTION_KEY` (optional)
- `IMAGE_UPLOAD_DIR` (optional, defaults to `/app/uploads` in Docker)

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
- `${DATA_DIR}/uploads` -> `/app/uploads` (uploaded images)

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
