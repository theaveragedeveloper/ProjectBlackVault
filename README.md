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
- [Having Trouble?](#having-trouble)

---

## What is ProjectBlackVault?

ProjectBlackVault is a **personal inventory and tracking app** for firearms owners. Think of it like a digital logbook — you can keep track of every gun you own, all your attachments and accessories, your ammunition stockpile, and your range sessions, all in one place.

Everything is stored **on your own computer or home server** — your data never goes to any outside company or cloud service. It's yours, private, and always accessible without an internet connection.

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

### Option 1: Desktop App — Easiest (Recommended for most users)

No technical knowledge needed. Just download and run it like any normal application.

**[⬇ Download for your platform →](https://theaveragedeveloper.github.io/ProjectBlackVault/)**

| Your Computer | File to Download |
|---------------|-----------------|
| Windows | `ProjectBlackVault-Setup.exe` |
| Mac | `ProjectBlackVault.dmg` |
| Linux | `ProjectBlackVault-Setup.AppImage` |

#### Step-by-step install guide

**Step 1 — Install Docker Desktop (free, required)**

The app runs inside Docker, a lightweight container system. You only need to install it once.

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Click **Download for [your platform]** and run the installer
3. Once installed, open **Docker Desktop** from your Applications or Start Menu
4. Wait until you see the green "Docker Desktop is running" status — this means it's ready

**Step 2 — Download and install ProjectBlackVault**

1. Download the file for your platform from the link above
2. Open the downloaded file:
   - **Windows:** Double-click `ProjectBlackVault-Setup.exe` to install, then launch it from the Start Menu
   - **Mac:** Open `ProjectBlackVault.dmg`, drag the app to Applications, then open it
   - **Linux:** Make the file executable, then run it (see tip below)

**Step 3 — First launch**

1. Make sure Docker Desktop is open and running (you should see it in your taskbar or menu bar)
2. Open ProjectBlackVault
3. The first time you open it, it may take 1–2 minutes to start while it sets up — this is normal
4. Your browser will open automatically and take you to the app

That's it! You're ready to start adding your gear.

#### First-launch tips

- **Mac — "App can't be opened" warning:** Right-click the app and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.
- **Windows — SmartScreen warning:** Click **More info**, then **Run anyway**. The app is safe — Windows doesn't recognize it because it's not from the Microsoft Store.
- **Linux:** Run `chmod +x ProjectBlackVault-Setup.AppImage` in a terminal to make it executable, then double-click to run.
- **App won't launch:** Make sure Docker Desktop is open first. ProjectBlackVault won't start without it.

---

### Option 2: Run It Yourself (For developers / technical users)

If you're comfortable with a terminal, you can run the app directly on your machine without Docker.

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

### Option 3: Home Server / Docker (For self-hosting enthusiasts)

If you run a home server or NAS and want ProjectBlackVault always available on your network:

```bash
# Start the app
docker-compose up -d

# See what's happening (logs)
docker-compose logs -f blackvault

# Stop the app
docker-compose down
```

The app automatically handles database setup when it starts. Your data is saved in named volumes so it persists even when you stop and restart the container:

- **`blackvault-db`** — your database (stored at `/app/data/vault.db` inside the container)
- **`blackvault-uploads`** — your uploaded photos and documents (at `/app/uploads`)

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

## Configuration (Advanced)

If you're running the app manually or on a server, configure it using a `.env` file. Copy `.env.example` to `.env` and edit as needed:

| Setting | Required? | What it does |
|---------|-----------|--------------|
| `DATABASE_URL` | Yes | Where your database file is stored. The default works for local use. |
| `SESSION_SECRET` | Required in production | A secret key that secures your login session. Generate one with: `openssl rand -hex 32` |
| `NODE_ENV` | No | Set to `production` when deploying on a server |
| `PORT` | No | The port the app runs on (default: `3000`) |

> **Security tip:** If you expose this app outside your home network, set a strong `SESSION_SECRET` and enable a password in Settings. Without `SESSION_SECRET`, the app will refuse to start in production mode.

---

## Having Trouble?

**The app won't open (Mac):**
Right-click the `.dmg` or app file and choose **Open**. If it still doesn't work, go to System Settings → Privacy & Security and click **Open Anyway**.

**The app won't open (Windows):**
Click **More info** on the SmartScreen warning, then **Run anyway**. Windows shows this warning for apps not distributed through the Microsoft Store.

**Docker Desktop isn't installed or isn't running:**
The desktop launcher requires Docker Desktop to be installed and running. [Download it here](https://www.docker.com/products/docker-desktop/) for free. Open Docker Desktop and wait for the green "running" status before launching ProjectBlackVault.

**The app is taking a long time to open:**
The first launch can take 1–2 minutes while Docker sets up the app. Subsequent launches are faster. If it's been more than 5 minutes, close the app, make sure Docker Desktop is running, and try again.

**The page won't load at localhost:3000:**
Make sure the app is still running in your terminal. If you closed the terminal, run `npm run dev` again.

**My data disappeared after a Docker update:**
Avoid using `docker-compose down -v` — the `-v` flag removes your data volumes. Use `docker-compose down` (without `-v`) to stop safely. If you've lost data, restore from your last backup (see [Backup & Data Safety](#backup--data-safety)).

**Something else is wrong:**
[Open an issue on GitHub](https://github.com/theaveragedeveloper/ProjectBlackVault/issues) and describe what happened — we're happy to help.

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
