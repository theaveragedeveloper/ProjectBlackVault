# ProjectBlackVault

Self-hosted firearms inventory and range tracking built with Next.js, Prisma, and SQLite.

## Getting Started

Use one of these supported setup paths:
1. Local run (Node.js)
2. Docker run (recommended for most users)

## Local Run (Node.js)

### Prerequisites

- Node.js 20+
- npm 9+

### Steps

```bash
# 1) Clone and enter the repo
git clone <repo-url>
cd ProjectBlackVault

# 2) Install dependencies
npm install

# 3) Configure environment
cp .env.example .env

# 4) Run database migrations
npx prisma migrate dev

# 5) (Optional) Seed sample data
npx prisma db seed

# 6) Start the app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Run (Published Image)

This uses `docker-compose.yml` and pulls `ghcr.io/theaveragedeveloper/projectblackvault:latest`.

### Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)

### Steps

```bash
# 1) Clone and enter the repo
git clone <repo-url>
cd ProjectBlackVault

# 2) Create persistent data directories
mkdir -p "$HOME/.blackvault/db" "$HOME/.blackvault/uploads"

# 3) Create runtime config
cat > .blackvault.env <<EOF
DATA_DIR=$HOME/.blackvault
PORT=3000
APP_BASE_URL=https://vault.yourdomain.com
VAULT_ENCRYPTION_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# 4) Start container
docker compose --env-file .blackvault.env up -d

# 5) Check status/logs
docker compose --env-file .blackvault.env ps
docker compose --env-file .blackvault.env logs -f
```

Open [http://localhost:3000](http://localhost:3000).

### Recommended for Home Server Deployments

Use a reverse proxy (Caddy/Nginx/Traefik) and a single HTTPS hostname (for example `https://vault.yourdomain.com`) instead of sharing raw IP addresses.

1. Route your HTTPS domain to this container's mapped port (`3000` by default).
2. Set `APP_BASE_URL` in `.blackvault.env` to that HTTPS URL.
3. Have users open that URL once, then install a desktop icon:
   - Chrome/Edge: **Install App**
   - Safari (macOS): **File -> Add to Dock**

Keep localhost/IP access as fallback troubleshooting paths only.

### Internet Lockdown (Recommended for Sensitive Data)

For a strict self-hosted posture, keep outbound internet features disabled by default:

```bash
ALLOW_RELEASE_LOOKUP=false
ALLOW_IMAGE_SEARCH_EGRESS=false
ALLOW_EXTERNAL_IMAGE_URLS=false
SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK=true
```

- This prevents background release lookups and external image/search traffic.
- In-app update actions remain manual and can be restricted to LAN/VPN clients.
- Enable any flag only when you explicitly need that capability.

Stop:

```bash
docker compose --env-file .blackvault.env down
```

Update to latest image:

```bash
docker compose --env-file .blackvault.env pull
docker compose --env-file .blackvault.env up -d
```

## Docker Run (Build from Local Source)

This uses `docker-compose.dev.yml` and builds from your current working tree.

```bash
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml logs -f
```

Open [http://localhost:3000](http://localhost:3000).

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

## Environment Variables

### Local (`.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` | SQLite connection string for local Node.js run |
| `SESSION_SECRET` | Recommended | — | Signs session cookies |
| `GOOGLE_CSE_API_KEY` | No | — | Google Custom Search API key for image lookup |
| `GOOGLE_CSE_SEARCH_ENGINE_ID` | No | — | Google CSE search engine ID |

### Docker (`.blackvault.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATA_DIR` | Recommended | `./data` | Host path for database/uploads |
| `PORT` | No | `3000` | Host port mapped to container port 3000 |
| `APP_BASE_URL` | Recommended | — | Canonical HTTPS URL shown in-app (used for hostname-first access guidance) |
| `ALLOW_RELEASE_LOOKUP` | Recommended | `false` | Allows GitHub release metadata lookups for launcher download hints |
| `ALLOW_IMAGE_SEARCH_EGRESS` | Recommended | `false` | Allows outbound Google CSE image search calls |
| `ALLOW_EXTERNAL_IMAGE_URLS` | Recommended | `false` | Allows storing/loading images from trusted third-party hosts |
| `SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK` | Recommended | `true` | Restricts in-app update actions to private LAN/VPN client IPs |
| `VAULT_ENCRYPTION_KEY` | Yes | — | Encryption key for sensitive values |
| `SESSION_SECRET` | Recommended | — | Signs session cookies |

## Data Responsibility Notice

You are solely responsible for all data you create, upload, store, or share through this app, including keeping your own backups. To the maximum extent permitted by law, we are not liable for any data loss, corruption, unauthorized access, or damages related to your data or use of the app.
