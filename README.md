<p align="center">
  <img src="./public/blackvault-logo.svg" alt="BlackVault Logo" width="120" height="120" />
</p>

<h1 align="center">ProjectBlackVault</h1>

<p align="center">
  Your personal, private firearms management app — runs on your own computer, no account or internet required.
</p>

---

## What is ProjectBlackVault?

ProjectBlackVault is a **personal inventory and tracking app** for firearms owners. Think of it like a digital logbook — you can keep track of every gun you own, all your attachments and accessories, your ammunition stockpile, and your range sessions, all in one place.

Everything is stored **on your own computer or home server** — your data never goes to any outside company or cloud service. It's yours, private, and always accessible without an internet connection.

---

## What Can It Do?

| Feature | What it means |
|---------|---------------|
| **Vault** | Keep a record of each firearm — photos, serial numbers, purchase dates, and value |
| **Loadout Builder** | Save different gear configurations for each gun (e.g. hunting setup vs. competition setup) |
| **Accessories** | Track optics, suppressors, grips, triggers, and other attachments |
| **Ammo Inventory** | See how much ammo you have by caliber, with alerts when you're running low |
| **Range Sessions** | Log your time at the range and track round counts through each firearm and part |
| **Training Drills** | Create drill templates, log your results, and track personal records |
| **Documents** | Store manuals, purchase receipts, or any other important paperwork |
| **Statistics & Charts** | See your progress and usage over time at a glance |

---

## Getting Started — Pick Your Method

There are three ways to run ProjectBlackVault. Production deployment is Docker-first.

---

### Option 1: Desktop App (Recommended)

No terminal required. Download the launcher from the latest GitHub release:

**[⬇ Download launcher assets](https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest)**

Expected files:
- `ProjectBlackVault-Setup.exe`
- `ProjectBlackVault.dmg`
- `ProjectBlackVault-Setup.AppImage`

Before launching:
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS).
- Linux users need Docker Engine + Compose plugin.

---

### Option 2: Production Self-Host Walkthrough (Docker)

Use this path for home server / NAS / always-on deployment.

**1) Clone repo**

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
```

**2) Run installer (generates `.blackvault.env`, keys, and data paths)**

```bash
# Linux / macOS
chmod +x install.sh && ./install.sh

# Windows
install.bat
```

**3) Verify health**

```bash
docker compose --env-file .blackvault.env ps
docker compose --env-file .blackvault.env logs -f
```

Open `http://localhost:3000/api/health` and confirm JSON contains `"status":"ok"`.

**4) Access from other devices**

1. Find host IP: `ip addr` (Linux), `ipconfig` (Windows), `ifconfig` (macOS)
2. Open `http://YOUR-HOST-IP:3000` from any LAN/VPN client
3. Ensure firewall allows inbound TCP on your selected port

**5) Day-2 operations**

```bash
# Start
docker compose --env-file .blackvault.env up -d

# Stop
docker compose --env-file .blackvault.env down

# Logs
docker compose --env-file .blackvault.env logs -f

# Update
./update.sh    # Linux/macOS
update.bat     # Windows
```

**6) Data + backup checklist**

- `DATA_DIR` is stored in `.blackvault.env` (default `~/.blackvault`)
- Database: `<DATA_DIR>/db/`
- Uploads: `<DATA_DIR>/uploads/`
- Back up `.blackvault.env` and data directory together
- Never lose `VAULT_ENCRYPTION_KEY` or encrypted data becomes unrecoverable
- In-app encrypted exports: **Settings → Secure Backup**

---

### Option 3: Developer Mode (Secondary)

Use this only for local development and feature work:

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

App URL: `http://localhost:3000`

---

## Setting a Password

By default, the app has no password — it's designed for personal use on a trusted network or computer. To add one, go to **Settings** inside the app and set your password from there.

> **Note:** The app password is set inside the app, not in a configuration file.

---

## Configuration (Advanced)

If you're running the app manually or on a server, you can configure it using a `.env` file. Copy `.env.example` to `.env` and edit as needed:

| Setting | Required? | What it does |
|---------|-----------|--------------|
| `DATABASE_URL` | Yes | Where your database file is stored. Default works for local use. |
| `SESSION_SECRET` | Required in production | A secret key that secures your login session. Generate one with: `openssl rand -hex 32` |
| `NODE_ENV` | No | Set to `production` when deploying on a server |
| `PORT` | No | The port the app runs on (default: `3000`) |

> **Security tip:** If you deploy this on a server or expose it outside your home network, make sure to set a strong `SESSION_SECRET` and enable a password in the Settings page. Without `SESSION_SECRET`, the app won't start in production mode.

---

## Having Trouble?

**The app won't open (Mac):**
Right-click the `.dmg` file and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.

**The app won't open (Windows):**
Click **More info** on the SmartScreen warning, then **Run anyway**. The app is safe — Windows just doesn't recognize it because it's not from the Microsoft Store.

**Docker Desktop isn't installed:**
The desktop launcher can install Docker Desktop automatically on Windows and macOS — click "Install Docker Automatically" when prompted. Or [download Docker Desktop here](https://www.docker.com/products/docker-desktop/) manually — it's free. Make sure to open Docker Desktop before launching ProjectBlackVault.

**The page won't load at localhost:3000:**
Check deployment status and logs:
`docker compose --env-file .blackvault.env ps`
`docker compose --env-file .blackvault.env logs -f`
If the container is stopped, restart with:
`docker compose --env-file .blackvault.env up -d`

**My data disappeared:**
If you're running via Docker, your data is in the directory configured during setup (default `~/.blackvault`). If you used `docker compose down -v`, that removes volumes too — avoid the `-v` flag unless you want to wipe everything.

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

### Project Structure

```
ProjectBlackVault/
├── launcher/               # Electron desktop launcher
│   ├── main.js             # Main process (Docker management, IPC)
│   ├── preload.js          # Context bridge
│   └── renderer/           # Launcher UI
├── docs/
│   └── index.html          # Download landing page (GitHub Pages)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Sample data seed script
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── api/            # REST API endpoints
│   │   ├── download/       # Launcher download page
│   │   ├── vault/          # Firearm management pages
│   │   ├── accessories/    # Accessory management pages
│   │   ├── builds/         # All loadouts overview
│   │   ├── ammo/           # Ammo inventory pages
│   │   ├── range/          # Range session logging
│   │   └── settings/       # App settings
│   ├── components/         # Shared UI components
│   └── lib/                # Utility functions, Prisma client, types
├── install.sh              # First-run setup wizard (Linux/macOS)
├── install.bat             # First-run setup wizard (Windows)
├── update.sh               # Update script (Linux/macOS)
├── update.bat              # Update script (Windows)
├── docker-compose.yml      # Production compose file
└── Dockerfile
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npm test             # Run tests
npm run lint         # Lint code
npm run typecheck    # TypeScript type checking
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Maintenance: Refresh stale merge-request branches

Use `scripts/refresh-mr-branches.sh` to update old MR branches with the latest target branch.

```bash
# Merge latest main into one or more MR branches
scripts/refresh-mr-branches.sh feature/old-1 feature/old-2

# Rebase workflow (force-with-lease push)
scripts/refresh-mr-branches.sh --rebase -t main mr/legacy-123

# Preview actions only
scripts/refresh-mr-branches.sh --dry-run mr/legacy-123
```

</details>
