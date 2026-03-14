# ProjectBlackVault

A self-hosted tactical firearms management application built with Next.js 16, Prisma, and SQLite.

---

## Easy Install (Desktop Launcher)

The easiest way to run ProjectBlackVault — no terminal required.

**[⬇ Download for your platform →](https://theaveragedeveloper.github.io/ProjectBlackVault/)**

| Platform | File |
|----------|------|
| Windows | `ProjectBlackVault-Setup.exe` |
| macOS | `ProjectBlackVault.dmg` |
| Linux | `ProjectBlackVault-Setup.AppImage` |

### Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free) must be installed and running

### First launch notes
- **macOS**: If Gatekeeper blocks the app, right-click it and choose **Open**
- **Windows**: If SmartScreen warns you, click **More info** → **Run anyway**
- **Linux**: Make the AppImage executable (`chmod +x ProjectBlackVault-Setup.AppImage`) then run it

```
[ screenshot placeholder ]
```

---

## Features

- **Vault** - Track your entire firearms inventory with images, serial numbers, acquisition dates, and valuations
- **Loadout Builder** - Create multiple named build configurations per firearm and toggle between active builds
- **Accessories** - Manage optics, suppressors, handguards, triggers, and all other parts with per-accessory round count tracking
- **Ammo Inventory** - Track ammunition stocks by caliber, brand, bullet type, and grain weight with low-stock alerts
- **Round Count Logs** - Log range sessions and maintain a full history of rounds through each part
- **All Loadouts View** - Cross-firearm build overview grouped by platform
- **Dark Tactical UI** - Optimized dark theme built for desktop and mobile

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- npm 9+

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd ProjectBlackVault

# 2. Install dependencies
npm install

# 3. Copy the environment file and configure
cp .env.example .env
# Edit .env and set DATABASE_URL (default is fine for local dev)

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed the database with sample data
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.


---

## Maintenance: Refresh stale merge-request branches

Use `scripts/refresh-mr-branches.sh` to update old MR branches with the latest target branch and push them back to origin.

```bash
# Merge latest main into one or more MR branches
scripts/refresh-mr-branches.sh feature/old-1 feature/old-2

# Rebase workflow (force-with-lease push)
scripts/refresh-mr-branches.sh --rebase -t main mr/legacy-123

# Preview actions only
scripts/refresh-mr-branches.sh --dry-run mr/legacy-123
```

If a conflict occurs, the script stops on the first conflicted branch so you can resolve it, complete the merge/rebase, and push.

---

## Docker Deployment

The application ships as a self-contained Docker image using a multi-stage build with Next.js standalone output.

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f blackvault

# Stop the container
docker-compose down
```

The container automatically runs `prisma migrate deploy` on startup before serving traffic.

Data is persisted in named Docker volumes:
- `blackvault-db` — SQLite database at `/app/data/vault.db`
- `blackvault-uploads` — User-uploaded images at `/app/uploads`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./prisma/dev.db` | SQLite connection string |
| `SESSION_SECRET` | Yes (Production) | — | Required in production. Signs session cookies to prevent forgery. Generate: `openssl rand -hex 32` |
| `NODE_ENV` | No | `development` | Set to `production` in deployed environments |
| `PORT` | No | `3000` | Port exposed by Docker Compose |
| `APP_PASSWORD` | — | — | Set via the Settings UI — not an environment variable |

> ⚠️ In production, startup will fail when `SESSION_SECRET` is missing to prevent unsigned sessions.

---

## Tech Stack

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

---

## Project Structure

```
ProjectBlackVault/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts             # Sample data seed script
├── src/
│   ├── app/                # Next.js App Router pages & API routes
│   │   ├── api/            # REST API endpoints
│   │   ├── vault/          # Firearm management pages
│   │   ├── accessories/    # Accessory management pages
│   │   ├── builds/         # All loadouts overview
│   │   ├── ammo/           # Ammo inventory pages
│   │   ├── range/          # Range session logging
│   │   └── settings/       # App settings
│   ├── components/         # Shared UI components
│   └── lib/                # Utility functions, Prisma client, types
├── Dockerfile
├── docker-compose.yml
└── .env.example
```
