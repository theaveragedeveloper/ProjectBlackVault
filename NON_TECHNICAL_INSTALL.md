# Non-Technical Install Guide (Docker-Only V1)

This guide is written for people who do not code.

ProjectBlackVault V1 is installed with Docker on your own machine (home server or on-prem computer).

For public V1 support, use direct Docker Compose commands from this guide.

## Before You Start

You need:

- A computer that stays on when you want to use BlackVault
- Internet access for first setup and updates
- Docker Desktop installed and running
- This `ProjectBlackVault` folder on that machine

If Docker is not installed yet:

- Windows/macOS: install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
- Linux: install Docker Engine + Docker Compose plugin

## Install BlackVault

### Step 1) Open Terminal In This Project Folder

Use the folder that contains `docker-compose.yml`.

### Step 2) Create Local Settings File

Copy/paste one command:

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
copy .env.example .env
```

### Step 3) Start The App

Copy/paste:

```bash
docker compose up -d --build
```

The first startup may take a few minutes.

### Step 4) Open The App

Open [http://localhost:3000](http://localhost:3000)

If it does not load right away, wait 20-30 seconds and refresh.

### Step 5) Complete First-Time Setup

1. Create your master password.
2. Save the password somewhere safe.
3. Continue into the app.

You will use this same password for future logins.

## Open From Another Device On Your Network

By default, the app is local-only. To allow phone/tablet/laptop access on your home network:

### Step 1) Edit `.env`

Open `.env` and set:

```text
BIND_ADDRESS=0.0.0.0
```

Save the file.

### Step 2) Restart The App

Copy/paste:

```bash
docker compose up -d --build
```

### Step 3) Find The Server IP Address

Copy/paste one command:

macOS:

```bash
ipconfig getifaddr en0
```

Linux:

```bash
hostname -I
```

Windows PowerShell:

```powershell
ipconfig
```

Look for a local IP like `192.168.x.x`.

### Step 4) Open From Another Device

Use this format in a browser on another device on the same network:

```text
http://<server-ip>:3000
```

Example:

```text
http://192.168.1.42:3000
```

## Daily Use Commands (Copy/Paste)

Stop app:

```bash
docker compose down
```

Start app:

```bash
docker compose up -d
```

Restart app:

```bash
docker compose restart
```

Check status:

```bash
docker compose ps
```

## Update Safely

### Step 1) Back Up First

Back up before every update (see next section).

### Step 2) Update App Files In This Folder

- If you use Git: pull latest changes.
- If you use ZIP releases: replace app files with the latest release files in the same folder, while keeping `data/` and `.env`.

### Step 3) Rebuild And Start

Copy/paste:

```bash
docker compose up -d --build
```

### Step 4) Verify Health

Copy/paste:

```bash
curl -fsS http://localhost:3000/api/health
```

## Back Up Before Changes

Back up all of these together:

- `data/db` (database and session secret)
- `data/uploads` (files/photos)
- `.env` (important settings such as encryption key)

### Step 1) Stop App

```bash
docker compose down
```

### Step 2) Copy Backup Files

Copy `data/` and `.env` to another drive, NAS, or cloud folder you trust.

### Step 3) Start App Again

```bash
docker compose up -d
```

Important: if you use an encryption key in `.env`, losing it can make encrypted fields unrecoverable.

## Common Mistakes And Fixes

### Problem: "Docker command not found" or app will not start

Fix:

1. Start Docker Desktop (or Docker service on Linux).
2. Run:

```bash
docker compose up -d --build
```

### Problem: Page will not open

Fix:

1. Confirm URL is `http://localhost:3000`
2. Run:

```bash
docker compose ps
docker compose logs --tail=150
```

### Problem: Setup screen does not show

Fix:

- Setup usually already happened for this data folder.
- Use the login screen with your existing password.

### Problem: Works on server but not phone

Fix:

1. Confirm `.env` has `BIND_ADDRESS=0.0.0.0`
2. Restart with `docker compose up -d --build`
3. Use `http://<server-ip>:3000`
4. Confirm both devices are on the same network

### Problem: Port 3000 is already used

Fix:

1. Edit `.env`
2. Change `PORT=3000` to `PORT=3001`
3. Run:

```bash
docker compose up -d --build
```

Then open `http://localhost:3001`.

## ChatGPT Prompt Pack

Use copy/paste prompts from [CHATGPT_INSTALL_PROMPTS.md](CHATGPT_INSTALL_PROMPTS.md).

## Screenshot Plan

Screenshots are not included yet. Capture plan is in [SCREENSHOT_CAPTURE_PLAN.md](SCREENSHOT_CAPTURE_PLAN.md).
