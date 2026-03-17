# ProjectBlackVault

Self-hosted firearms inventory and range tracking built with Next.js, Prisma, and SQLite.

## Features

- **Firearms inventory management** with structured records you host and control.
- **Range session tracking** to log performance and session details over time.
- **Self-hosted by default** so your data stays on your infrastructure.
- **Simple deployment options** with either Docker (recommended) or direct Node.js runtime.
- **Local SQLite storage** for low-maintenance setup and backup workflows.
- **Security-focused configuration** including session secrets, encryption key support, and outbound network controls.

## Installation

Choose one installation path below based on how you want to run the app.

| Setup Path | Best For | What You Install | First Run |
|---|---|---|---|
| Docker | Most users | Docker Desktop (or Docker Engine + Compose plugin) | Guided setup script |
| Local (Node.js) | Development/customization | Node.js 20+ and npm 9+ | Run app directly with npm |

### Option A: Docker (Recommended)

#### 1) Install prerequisites

- Windows/macOS: Docker Desktop
- Linux: Docker Engine + Docker Compose plugin

#### 2) Clone this repo

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
```

Quick copy/paste (clone + enter folder):

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git && cd ProjectBlackVault
```

#### 3) Run first-time installer

macOS/Linux:

```bash
chmod +x install.sh
./install.sh
```

Windows (Command Prompt or PowerShell):

```bat
install.bat
```

The installer creates `.blackvault.env`, generates secret keys, creates data folders, and starts the container. It can also generate a dedicated `PASSWORD_RECOVERY_SECRET` if you opt in during setup.

#### 4) Open the app

Open [http://localhost:3000](http://localhost:3000) (or the port you chose during setup).

### Day-2 Docker commands

Stop:

```bash
docker compose --env-file .blackvault.env down
```

Start:

```bash
docker compose --env-file .blackvault.env up -d
```

Update:

```bash
# Linux/macOS
./update.sh

# Windows
update.bat
```

### Option B: Local Machine (Node.js)

#### 1) Install prerequisites

- Node.js 20+
- npm 9+

#### 2) Clone and install dependencies

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
npm install
```

Quick copy/paste (clone + enter folder + install):

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git && cd ProjectBlackVault && npm install
```

#### 3) Create local config

```bash
cp .env.example .env
```

#### 4) Create/update database schema

```bash
npx prisma migrate dev
```

#### 5) Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What To Do After First Launch

1. Open [http://localhost:3000](http://localhost:3000).
2. Verify health endpoint: [http://localhost:3000/api/health](http://localhost:3000/api/health) (should return `{"ok":true}`).
3. Back up your secrets:
   - Docker installs: back up `.blackvault.env` and your `DATA_DIR`.
   - Do not lose `VAULT_ENCRYPTION_KEY` if you store encrypted data.
   - If enabled, protect `PASSWORD_RECOVERY_SECRET` like a root credential; exposure can enable account takeover through recovery flows.


## Password Recovery Secret (Operational Guidance)

Use a **dedicated** `PASSWORD_RECOVERY_SECRET` for account/password recovery workflows.

- Generate with a cryptographically secure random value (example: `openssl rand -hex 32`).
- Store it in `.blackvault.env` (Docker) or `.env` (local) with your other secrets.
- **Do not** reuse `VAULT_ENCRYPTION_KEY` for recovery or auth logic; encryption-at-rest and authentication recovery must remain separated.
- Treat this value as highly sensitive. If it appears in screenshots, logs, terminal recordings, chat paste, or support tickets, an attacker could potentially reset accounts and take over access.

### Recovery Runbook

If you suspect recovery compromise or perform emergency account recovery:

1. Rotate `PASSWORD_RECOVERY_SECRET` immediately.
2. Rotate any other potentially exposed secrets (`SESSION_SECRET`, API keys, and any externally integrated credentials).
3. Restart BlackVault so the new secrets take effect.
4. Force re-authentication for all users (for example by rotating `SESSION_SECRET` if needed).
5. Ask all users to log in again and verify no unauthorized account changes occurred.

Post-recovery hardening:

- Audit logs and shell history for accidental secret exposure.
- Remove/redact compromised screenshots, logs, ticket attachments, or chat messages containing secret values.
- Move secret storage to a dedicated secret manager if you currently keep plaintext copies outside `.blackvault.env`/`.env`.

## Common Issues

### Docker is installed but app will not start

- Make sure Docker Desktop is running (or Linux Docker daemon is active).
- Wait until Docker reports healthy, then start again.

### Port 3000 is already in use

- Pick a different port during setup (for example `3001`).
- Docker users can also set `PORT=<new-port>` in `.blackvault.env`.

### Docker Compose missing

- Install Docker Compose plugin and retry.
- Docs: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

### Lost encryption key warning

- If `VAULT_ENCRYPTION_KEY` is lost after data is encrypted, that encrypted data cannot be recovered.
- Back up `.blackvault.env` in a secure location.

## Advanced / Optional

### Home Server Deployment (Reverse Proxy + HTTPS)

Use a reverse proxy (Caddy/Nginx/Traefik) and a single HTTPS hostname (example: `https://vault.yourdomain.com`) instead of sharing raw IP addresses.

1. Route your HTTPS domain to this container host port (`3000` by default).
2. Set `APP_BASE_URL` in `.blackvault.env` to that HTTPS URL.
3. Have users open that URL once, then install a desktop icon:
   - Chrome/Edge: **Install App**
   - Safari (macOS): **File -> Add to Dock**

Keep localhost/IP access as fallback troubleshooting paths only.

### Internet Lockdown (Security-First Defaults)

For a strict self-hosted posture, keep outbound internet features disabled by default:

```bash
ALLOW_RELEASE_LOOKUP=false
ALLOW_IMAGE_SEARCH_EGRESS=false
ALLOW_EXTERNAL_IMAGE_URLS=false
SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK=true
```

- This blocks background release lookups and external image/search traffic.
- Enable only when you intentionally need the feature.

### Docker: Build From Local Source

Use this if you want to run your current working tree instead of the published image.

```bash
docker compose -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.dev.yml logs -f
```

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

### Environment Variables

#### Local (`.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` | SQLite connection string for local Node.js run |
| `SESSION_SECRET` | Yes | — | Signs and verifies session cookies for all protected API routes |
| `SESSION_MAX_AGE_SECONDS` | No | `28800` | Session cookie lifetime in seconds (min 300, max 86400) |
| `PASSWORD_RECOVERY_SECRET` | Recommended | — | Dedicated secret for password/account recovery workflows; do not reuse `VAULT_ENCRYPTION_KEY` |
| `GOOGLE_CSE_API_KEY` | No | — | Google Custom Search API key for image lookup |
| `GOOGLE_CSE_SEARCH_ENGINE_ID` | No | — | Google CSE search engine ID |

#### Docker (`.blackvault.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATA_DIR` | Recommended | `./data` | Host path for database/uploads |
| `PORT` | No | `3000` | Host port mapped to container port 3000 |
| `APP_BASE_URL` | Recommended | — | Canonical HTTPS URL shown in-app |
| `ALLOW_RELEASE_LOOKUP` | Recommended | `false` | Allows GitHub release metadata lookups |
| `ALLOW_IMAGE_SEARCH_EGRESS` | Recommended | `false` | Allows outbound Google CSE image search calls |
| `ALLOW_EXTERNAL_IMAGE_URLS` | Recommended | `false` | Allows storing/loading images from trusted third-party hosts |
| `SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK` | Recommended | `true` | Restricts in-app update actions to private LAN/VPN client IPs |
| `VAULT_ENCRYPTION_KEY` | Yes | — | Encryption key for sensitive values |
| `SESSION_SECRET` | Yes | — | Signs and verifies session cookies for all protected API routes |
| `SESSION_MAX_AGE_SECONDS` | No | `28800` | Session cookie lifetime in seconds (min 300, max 86400) |
| `PASSWORD_RECOVERY_SECRET` | Recommended | — | Dedicated secret for password/account recovery workflows; do not reuse `VAULT_ENCRYPTION_KEY` |

### Optional Launcher And Package Channels

- Launcher downloads are available on GitHub Releases.
- Advanced package channels (like winget/homebrew tap) may not always be published for every release; if unavailable, use the direct installer download from releases.

## Data Responsibility Notice

You are solely responsible for all data you create, upload, store, or share through this app, including keeping your own backups. To the maximum extent permitted by law, we are not liable for any data loss, corruption, unauthorized access, or damages related to your data or use of the app.
