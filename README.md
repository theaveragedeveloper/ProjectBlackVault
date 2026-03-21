# ProjectBlackVault (V1)

ProjectBlackVault is a private, self-hosted vault for firearm inventory, builds, ammo records, and range logs.

V1 public release support is **Docker-only** for home server / on-prem installs.

## V1 Public Support Scope

- Supported path: Docker Compose from this repository folder
- Not a supported public V1 path: desktop/downloader/one-click installer flows
- Legacy helper scripts may remain for compatibility, but docs and support are Docker-first

## What This App Is

ProjectBlackVault helps you keep sensitive records on hardware you control.

- Runs on your own machine with Docker
- Stores your data locally (SQLite + uploaded files)
- Uses a master password for setup and login
- Lets you access the app from devices on your local network

## Who It Is For

- Owners who want an organized local system for inventory and history
- Families or households that want private, shared local access
- Users who do not want cloud-hosted storage for this data

## Why Self-Hosted Matters

- Your records stay on your machine
- You control backups and recovery
- You decide if the app is reachable only locally or on your LAN
- You are not locked into a third-party SaaS account

## Docker-Only Install Walkthrough (V1)

For a beginner-focused guide, see [NON_TECHNICAL_INSTALL.md](NON_TECHNICAL_INSTALL.md).

### 1) Prerequisites

- A computer or home server that stays on when you want the app available
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Compose plugin (Linux)
- This project folder on that machine

### 2) Open a Terminal in the Project Folder

Use the folder that contains `docker-compose.yml`.

### 3) Create a Local Config File

macOS/Linux:

```bash
cp .env.example .env
```

Windows (PowerShell):

```powershell
copy .env.example .env
```

### 4) Start the App

```bash
docker compose up -d --build
```

### 5) Open the App

- [http://localhost:3000](http://localhost:3000)
- If the page does not open immediately, wait 20-30 seconds and refresh.

## First Startup

On first launch, you will see setup.

1. Create your master password.
2. Save this password somewhere safe.
3. Finish setup and enter the dashboard.

After setup, future launches show a login screen instead of setup.

## Setup And Login

- Setup appears once per data folder
- Login uses the password you created during setup
- If setup is missing and you see login, that data folder was already initialized

## Backups

Back up these items together:

- `./data/db` (database and local session secret)
- `./data/uploads` (uploaded files)
- `.env` (if you store custom settings such as encryption key there)

Minimum safe backup workflow:

```bash
docker compose down
```

Then copy `data/` and `.env` to another drive/location.

Start again:

```bash
docker compose up -d
```

## Updating

1. Back up first (section above).
2. Update app code to the newest release in this folder.
3. Rebuild and restart:

```bash
docker compose up -d --build
```

4. Verify health:

```bash
curl -fsS http://localhost:3000/api/health
```

## Troubleshooting

### App does not load

Run:

```bash
docker compose ps
docker compose logs --tail=150
```

### Setup screen is missing

- This usually means setup already completed for this data folder.
- Try logging in with your existing password.

### Port 3000 is already in use

1. Edit `.env`
2. Change `PORT=3000` to `PORT=3001`
3. Restart:

```bash
docker compose up -d --build
```

Then open `http://localhost:3001`.

### Docker command fails

- Confirm Docker is running.
- Confirm Compose is available:

```bash
docker compose version
```

## Local Network Access (Phone/Tablet/Another PC)

By default, `.env.example` uses `BIND_ADDRESS=127.0.0.1` (same machine only).

To allow devices on your home network:

1. Open `.env`
2. Set:

```text
BIND_ADDRESS=0.0.0.0
```

3. Restart:

```bash
docker compose up -d --build
```

4. Find your server IP (example `192.168.1.42`) and open:

```text
http://192.168.1.42:3000
```

5. Make sure the device is on the same network.

## FAQ

### Do I need a desktop app, downloader, or installer for V1?
No. Public V1 support is Docker-only.

### Does uninstalling Docker delete my records?
Not by itself. Your records are in your data folder (`./data` unless changed).

### Can I move data to another machine?
Yes. Move your `data/` folder and `.env`, then start the app with Docker on the new machine.

### What if I forget my master password?
There is no password recovery flow in V1. Keep a secure password record.

### Do I need internet after install?
You need internet to pull/build dependencies and updates. Day-to-day local use is on your LAN.

## ChatGPT Helper Prompts

Use ready-to-paste prompts from [CHATGPT_INSTALL_PROMPTS.md](CHATGPT_INSTALL_PROMPTS.md).

## Screenshot Capture Plan

Screenshots are not included yet. Capture plan is documented in [SCREENSHOT_CAPTURE_PLAN.md](SCREENSHOT_CAPTURE_PLAN.md).
