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
| `VAULT_ENCRYPTION_KEY` | Yes | — | Encryption key for sensitive values |
| `SESSION_SECRET` | Recommended | — | Signs session cookies |
