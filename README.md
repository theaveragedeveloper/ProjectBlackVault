<p align="center">
  <img src="./public/blackvault-logo.svg" alt="BlackVault Logo" width="120" height="120" />
</p>

<h1 align="center">ProjectBlackVault</h1>

<p align="center">
  Your personal, private firearms management app — runs on your own computer, no account or internet required.
</p>

<p align="center">
  <a href="https://github.com/theaveragedeveloper/ProjectBlackVault/actions/workflows/quality-gate.yml">
    <img src="https://github.com/theaveragedeveloper/ProjectBlackVault/actions/workflows/quality-gate.yml/badge.svg" alt="Quality Gate" />
  </a>
  <a href="https://github.com/theaveragedeveloper/ProjectBlackVault/actions/workflows/release.yml">
    <img src="https://github.com/theaveragedeveloper/ProjectBlackVault/actions/workflows/release.yml/badge.svg" alt="Build & Release" />
  </a>
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version 0.1.0" />
  <img src="https://img.shields.io/badge/self--hosted-yes-green" alt="Self-Hosted" />
</p>

---

## Quick Links

- [What is ProjectBlackVault?](#what-is-projectblackvault)
- [Why use it?](#why-projectblackvault)
- [What can it do?](#what-can-it-do)
- [Getting Started](#getting-started--pick-your-method)
- [Backup & Data Safety](#backup--data-safety)
- [Setting a Password](#setting-a-password)
- [Password Recovery Secret](#password-recovery-secret-operational-guidance)
- [Having Trouble?](#having-trouble)

---

## What is ProjectBlackVault?

ProjectBlackVault is a **personal inventory and tracking app** for firearms owners. Think of it like a digital logbook — you can keep track of every gun you own, all your attachments and accessories, your ammunition stockpile, and your range sessions, all in one place.

Everything is stored **on your own computer or home server** — your data never goes to any outside company or cloud service. It's yours, private, and always accessible without an internet connection.

## What ProjectBlackVault Does

ProjectBlackVault is a practical self-hosted system for managing your armory records in one place.

- Register firearms with serials, photos, acquisition details, and build configurations.
- Manage build components and accessories (optics, suppressors, lights, and more).
- Track ammo inventory by caliber with stock levels, transactions, and spend trends.
- Log range sessions and drills with round counts and historical performance data.
- Schedule and record maintenance using round-count or time-based intervals.
- Store manuals and documents, then export and restore encrypted backups.

Self-hosted by default means your data stays on infrastructure you control, with no required cloud account.

---

## Why ProjectBlackVault?

| | |
|--|--|
| **Private** | Nothing ever leaves your computer. No account, no cloud sync, no data sharing — ever. |
| **Free** | No subscription, no ads, no hidden costs. Open source and free to use. |
| **Offline-first** | Works without internet — at the range, in the field, anywhere. |
| **Your data, your control** | Everything is stored as a simple database file on your hard drive. Back it up, move it, or delete it whenever you want. |

---

## What Can It Do?

| Feature | What it means for you |
|---------|----------------------|
| **Vault** | Keep a record of each firearm — photos, serial numbers, purchase dates, and current value |
| **Loadout Builder** | Save different gear setups for each gun (e.g. a hunting config and a competition config) and switch between them instantly |
| **Accessories** | Track every optic, suppressor, grip, trigger, and part you own — including how many rounds have gone through each one |
| **Ammo Inventory** | See exactly how much ammo you have by caliber, and get an alert before you run out |
| **Range Sessions** | Log every trip to the range, track round counts through each firearm and part, and keep notes on conditions |
| **Training Drills** | Create drill templates, record your times and scores, and watch your personal records improve over time |
| **Documents** | Store owner's manuals, purchase receipts, warranty cards, and any other paperwork digitally |
| **Statistics & Charts** | See your usage history, round counts, and training progress at a glance |

---

## Screenshots

> Screenshots coming soon. Below is a preview of the sections you'll find inside the app.

| Vault | Range Session |
|-------|--------------|
| _[ screenshot placeholder ]_ | _[ screenshot placeholder ]_ |

| Ammo Inventory | Dashboard |
|----------------|-----------|
| _[ screenshot placeholder ]_ | _[ screenshot placeholder ]_ |

---

## Getting Started — Pick Your Method

There are three ways to run ProjectBlackVault. **Choose the one that fits you best:**

---

### Option A: Desktop App — No Docker Required (Recommended)

The app includes its own built-in server — nothing else to install.

**[Download for your platform](https://theaveragedeveloper.github.io/ProjectBlackVault/)**

| Your Computer | File to Download |
|---------------|-----------------|
| Windows | `ProjectBlackVault-Setup.exe` |
| Mac | `ProjectBlackVault.dmg` |
| Linux | `ProjectBlackVault-Setup.AppImage` |

#### First-launch tips

- **Mac — "App can't be opened" warning:** Right-click the app and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.
- **Windows — SmartScreen warning:** Click **More info**, then **Run anyway**. The app is safe — Windows doesn't recognize it because it's not from the Microsoft Store.
- **Linux:** Run `chmod +x ProjectBlackVault-Setup.AppImage` in a terminal to make it executable, then double-click to run.

---

### Option B: Docker Launcher (For network sharing / home servers)

If you want BlackVault always available on your network or run it on a NAS/home server:

#### 1) Install prerequisites

- Windows/macOS: Docker Desktop
- Linux: Docker Engine + Docker Compose plugin

#### 2) Clone this repo

```bash
git clone <repo-url>
cd ProjectBlackVault
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

#### 4) Open the app and verify first launch

1. Open [http://localhost:3000](http://localhost:3000) (or the port you chose during setup).
2. Verify health endpoint: [http://localhost:3000/api/health](http://localhost:3000/api/health) (should return `{"ok":true}`).
3. Back up your secrets:
   - Docker installs: back up `.blackvault.env` and your `DATA_DIR`.
   - Do not lose `VAULT_ENCRYPTION_KEY` if you store encrypted data.

#### 5) Day-2 Docker operations

Start:

```bash
docker compose --env-file .blackvault.env up -d
```

Stop:

```bash
docker compose --env-file .blackvault.env down
```

Logs:

```bash
docker compose --env-file .blackvault.env logs -f
```

Update:

```bash
# Linux/macOS
./update.sh

# Windows
update.bat
```

---

### Option C: Run It Yourself (For developers / technical users)

If you're comfortable with a terminal, you can run the app directly on your machine.

**You'll need:**
- [Node.js](https://nodejs.org/) version 20 or higher
- npm version 9 or higher (comes with Node.js)

**Steps:**

```bash
# 1. Download the code
git clone <repo-url>
cd ProjectBlackVault

# 2. Install the app's dependencies
npm install

# 3. Set up your configuration file
cp .env.example .env
# Open the .env file in a text editor — the default settings work fine for local use

# 4. Set up the database
npx prisma migrate dev

# 5. (Optional) Add some sample data to explore the app
npx prisma db seed

# 6. Start the app
npm run dev
```

Then open your browser and go to **[http://localhost:3000](http://localhost:3000)**

---

## Backup & Data Safety

ProjectBlackVault has built-in backup and restore — it's the best way to protect your data and move it between devices.

### What gets backed up

Everything — your firearms, accessories, loadouts, ammo inventory, range session logs, training drill records, stored documents, and app settings. All in one file.

### How to back up

1. Open the app and go to **Settings**
2. Find the **Backup** section
3. Click **Download Backup File**
4. Save the `.json` file somewhere safe — a USB drive, your cloud storage (Dropbox, Google Drive, iCloud), or another computer

> **Tip:** Make a habit of downloading a backup once a month, or any time you add a lot of new data.

### How to restore

1. Open the app and go to **Settings**
2. Find the **Backup** section
3. Click **Restore from Backup**
4. Select your previously saved `.json` backup file
5. Confirm — the restore will replace all current data with what's in the backup

> **Important:** Restoring a backup replaces everything currently in the app. Make sure you're restoring the right file, and consider downloading a fresh backup first as a safety net.

---

## Setting a Password

By default, the app has no password — it's designed for personal use on a trusted home network or computer. To add one:

1. Open the app and go to **Settings**
2. Find the **Security** section
3. Set your password

> **Note:** The app password is managed inside the app itself, not through a config file.

---

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

---

## Configuration (Advanced)

If you're running the app manually or on a server, configure it using a `.env` file. Copy `.env.example` to `.env` and edit as needed:

| Setting | Required? | What it does |
|---------|-----------|--------------|
| `DATABASE_URL` | Yes | Where your database file is stored. The default works for local use. |
| `SESSION_SECRET` | Yes (local Node.js) | A secret key that secures your login session. Docker auto-generates this. Generate one with: `openssl rand -hex 32` |
| `SESSION_MAX_AGE_SECONDS` | No | Session cookie lifetime in seconds (default: 28800 = 8 hours) |
| `PASSWORD_RECOVERY_SECRET` | Recommended | Dedicated secret for password/account recovery workflows; do not reuse `VAULT_ENCRYPTION_KEY` |
| `VAULT_ENCRYPTION_KEY` | Recommended | Encryption key for sensitive values (serial numbers, notes) |
| `NODE_ENV` | No | Set to `production` when deploying on a server |
| `PORT` | No | The port the app runs on (default: `3000`) |

BlackVault Docker installs auto-bootstrap `SESSION_SECRET` on first start:
- If `SESSION_SECRET` is already set in the environment, that value is used and persisted.
- If missing, the container generates a 32-byte hex secret once and stores it at `DATA_DIR/db/config/session.env` (permissions restricted to owner).
- Deleting/resetting `session.env` forces a new secret and logs out all active sessions.

> **Security tip:** If you expose this app outside your home network, set a strong `SESSION_SECRET` and enable a password in Settings. Without `SESSION_SECRET`, the app will refuse to start in production mode.

---

## Common Issues

### The app won't open (Mac)

Right-click the `.dmg` or app file and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.

### The app won't open (Windows)

Click **More info** on the SmartScreen warning, then **Run anyway**. Windows shows this warning for apps not distributed through the Microsoft Store.

### Docker Desktop isn't installed or isn't running

The Docker launcher requires Docker Desktop to be installed and running. [Download it here](https://www.docker.com/products/docker-desktop/) for free. Open Docker Desktop and wait for the green "running" status before launching ProjectBlackVault.

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

### The app is taking a long time to open

The first launch can take 1–2 minutes while the app sets up. Subsequent launches are faster. If it's been more than 5 minutes, close the app and try again.

### The page won't load at localhost:3000

Make sure the app is still running in your terminal. If you closed the terminal, run `npm run dev` again.

### My data disappeared after a Docker update

Avoid using `docker-compose down -v` — the `-v` flag removes your data volumes. Use `docker-compose down` (without `-v`) to stop safely. If you've lost data, restore from your last backup (see [Backup & Data Safety](#backup--data-safety)).

### Something else is wrong

[Open an issue on GitHub](https://github.com/theaveragedeveloper/ProjectBlackVault/issues) and describe what happened — we're happy to help.

---

## Having Trouble?

**The app won't open (Mac):**
Right-click the `.dmg` or app file and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.

**The app won't open (Windows):**
Click **More info** on the SmartScreen warning, then **Run anyway**. Windows shows this warning for apps not distributed through the Microsoft Store.

**Docker Desktop isn't installed or isn't running:**
The Docker launcher requires Docker Desktop to be installed and running. [Download it here](https://www.docker.com/products/docker-desktop/) for free. Open Docker Desktop and wait for the green "running" status before launching ProjectBlackVault.

**The app is taking a long time to open:**
The first launch can take 1–2 minutes while the app sets up. Subsequent launches are faster. If it's been more than 5 minutes, close the app and try again.

**The page won't load at localhost:3000:**
Make sure the app is still running in your terminal. If you closed the terminal, run `npm run dev` again.

**My data disappeared after a Docker update:**
Avoid using `docker-compose down -v` — the `-v` flag removes your data volumes. Use `docker-compose down` (without `-v`) to stop safely. If you've lost data, restore from your last backup (see [Backup & Data Safety](#backup--data-safety)).

**Something else is wrong:**
[Open an issue on GitHub](https://github.com/theaveragedeveloper/ProjectBlackVault/issues) and describe what happened — we're happy to help.

---

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
| `SESSION_SECRET` | Recommended | — | Signs session cookies |
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
| `SESSION_SECRET` | Recommended | — | Signs session cookies |

### Optional Launcher And Package Channels

- Launcher downloads are available on GitHub Releases.
- Advanced package channels (like winget/homebrew tap) may not always be published for every release; if unavailable, use the direct installer download from releases.

---

## Data Responsibility Notice

You are solely responsible for all data you create, upload, store, or share through this app, including keeping your own backups. To the maximum extent permitted by law, we are not liable for any data loss, corruption, unauthorized access, or damages related to your data or use of the app.

---

## For Developers

<details>
<summary>Tech Stack, Project Structure & Scripts</summary>

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Database | SQLite via [Prisma ORM](https://www.prisma.io) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [Radix UI](https://www.radix-ui.com) primitives |
| Icons | [Lucide React](https://lucide.dev) |
| Charts | [Recharts](https://recharts.org) |
| Animation | [Framer Motion](https://www.framer.com/motion) |
| State | [Zustand](https://zustand-demo.pmnd.rs) |
| Validation | [Zod](https://zod.dev) |
| Container | Docker + Docker Compose |
| Desktop | Electron (standalone builds for Windows, macOS, Linux) |

### Project Structure

```
ProjectBlackVault/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Sample data seed script
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── api/            # REST API endpoints
│   │   ├── (app)/          # Route group for app pages
│   │   │   ├── vault/      # Firearm management pages
│   │   │   ├── accessories/# Accessory management pages
│   │   │   ├── builds/     # All loadouts overview
│   │   │   ├── ammo/       # Ammo inventory pages
│   │   │   └── range/      # Range session logging
│   │   ├── login/          # Authentication
│   │   └── settings/       # App settings
│   ├── components/         # Shared UI components
│   └── lib/                # Utility functions, Prisma client, types
├── electron/               # Electron desktop app wrapper
│   ├── main.js             # Main process (server spawn, window mgmt)
│   ├── splash.html         # Loading splash screen
│   └── package.json        # Electron builder config
├── scripts/                # Utility scripts
│   └── bootstrap-session-secret.sh  # Docker session secret auto-gen
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

### Available Scripts

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Run production build
npm test               # Run tests
npm run lint           # Lint code
npm run typecheck      # TypeScript type checking
npm run db:migrate     # Run database migrations
npm run db:seed        # Seed database with sample data
npm run electron:dev   # Build + launch Electron desktop app locally
npm run electron:build # Build Electron installers without publishing
npm run release        # Tag version and push to trigger CI release
```

</details>
