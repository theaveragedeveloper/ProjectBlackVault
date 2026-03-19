# BlackVault (V1)

BlackVault is a self-hosted, local-first vault for firearm inventory, builds, ammo, and range logs.

This V1 release is Docker-only.

## 1. Project Overview

BlackVault helps you keep your records private and on your own machine.

- Runs locally with Docker
- Stores data in local files (SQLite + uploads)
- Requires a master password to unlock the app
- Supports access from your computer and phone on your home network

## 2. Features

- Firearm inventory tracking
- Accessory and build tracking
- Ammo inventory and transaction history
- Range session logging and drill history
- Photo and document uploads
- Optional at-rest encryption key configuration
- Local export tools (JSON/CSV/PDF from Settings)

## 3. Easy Install (Docker)

Docker is an app that runs software in a packaged, reliable way so setup is easier across different computers.

### Before You Start

- Install Docker Desktop and make sure it is running
- Keep this project folder on your computer
- Have 3-10 minutes for the first build (normal on first run)

### Step A: Download the Project

Choose one:

1. Download ZIP from the repository page, then unzip it.
2. Or clone with Git:

```bash
git clone <your-repo-url> ProjectBlackVault
```

### Step B: Open the Project Folder

Open the `ProjectBlackVault` folder in Finder/File Explorer.

### Step C: Open Terminal in This Folder

- macOS: Open Terminal, then drag the `ProjectBlackVault` folder into Terminal and press Enter.
- Windows: Open PowerShell, then `cd` into the `ProjectBlackVault` folder.
- Linux: Right-click the folder and choose "Open in Terminal".

### Step D: Start BlackVault

Run:

```bash
docker compose up -d --build
```

What to expect:

- The first run downloads/builds images and can take a few minutes.
- You may see Docker doing a lot of work at first. This is expected.
- When finished, BlackVault runs in the background.

Open the app:

- [http://localhost:3000](http://localhost:3000)

If the page does not load right away, wait 15-30 seconds and refresh once.

## 4. First Run (What to Expect)

On the first launch, BlackVault asks you to create a master password.

- This password unlocks your vault.
- This first-run setup appears only once for a given data folder.
- After setup, you are taken into the app and use that password for future logins.

If setup does not appear and you see a login form, the vault was already initialized on this data folder.

## 5. Access from Phone / Other Devices

To use BlackVault on your phone:

- Your phone and computer must be on the same Wi-Fi.
- On your computer, open BlackVault and go to `Settings` -> `Network Access`.
- Use the shown local link on your phone, for example:
  - `http://192.168.1.42:3000`

BlackVault shows this local network link in Settings so you can copy or scan it.

## 6. Guided Install with ChatGPT

Use this prompt with ChatGPT if you want hand-holding setup:

```text
Help me install and run BlackVault on my computer using Docker.

Important instructions:
- Assume I am non-technical.
- Give exactly one step at a time.
- Wait for my confirmation before moving on.
- If I hit an error, explain the fix in plain language and keep going.
- Help me open BlackVault at http://localhost:3000.
- Then help me access it from my phone on the same Wi-Fi using the local network URL.
- If needed, help me do a full clean reset safely.

While we work:
- Ask me to paste command output when useful.
- Keep each step short and specific.
- Do not skip checks.
```

## 7. Managing the App (Start/Stop/Restart)

Stop:

```bash
docker compose down
```

Start again:

```bash
docker compose up -d
```

Restart:

```bash
docker compose restart
```

Rebuild after updates:

```bash
docker compose up -d --build
```

## 8. Reset / Fresh Start

This will delete your vault data.

```bash
docker compose down -v --remove-orphans
rm -rf ./data
docker compose up -d --build
```

After reset, the first-run setup screen appears again.

Note: if you changed `DATA_DIR`, delete that folder instead of `./data`.

## 9. Troubleshooting

### 1) Works on computer but not phone

- Confirm phone and computer are on the same Wi-Fi.
- Use the URL shown in `Settings` -> `Network Access`.
- If you copied `.env.example` to `.env`, make sure `BIND_ADDRESS=0.0.0.0` for phone access.
- Restart after changes:

```bash
docker compose down
docker compose up -d
```

### 2) Setup screen not showing

- If you see the login screen, setup already happened for this data folder.
- Use your existing password.
- To force setup again, run the reset steps in section 8 (this erases data).

### 3) App not loading

- Check URL: [http://localhost:3000](http://localhost:3000)
- Check container status:

```bash
docker compose ps
```

- Check logs:

```bash
docker compose logs -f blackvault
```

- Rebuild and restart:

```bash
docker compose up -d --build
```

### 4) Docker issues

- Make sure Docker Desktop is running.
- Verify Compose is available:

```bash
docker compose version
```

- If Docker got into a bad state, restart Docker Desktop and run:

```bash
docker compose down --remove-orphans
docker compose up -d --build
```

## 10. Advanced / Technical Notes

### Environment Variables (Optional)

- `PORT` (default `3000`)
- `BIND_ADDRESS` (default from compose fallback is `0.0.0.0`; `.env.example` uses `127.0.0.1`)
- `DATA_DIR` (default `./data`)
- `SESSION_SECRET` (optional; auto-generated and persisted when unset)
- `SESSION_COOKIE_SECURE` (`auto`, `true`, or `false`)
- `VAULT_ENCRYPTION_KEY` (optional fixed encryption key)
- `ALLOW_ENCRYPTION_KEY_EXPORT` (default `false`)

### Data Storage Paths

Docker bind mounts:

- `${DATA_DIR:-./data}/db` -> `/app/data`
- `${DATA_DIR:-./data}/uploads` -> `/app/uploads`

Auth/setup state is persisted in `${DATA_DIR}/db` (including `vault.db` and session secret file).

### Security Notes

- Keep `BIND_ADDRESS=127.0.0.1` if you only want same-machine access.
- For remote/public exposure, put BlackVault behind HTTPS.
- `VAULT_ENCRYPTION_KEY` via environment is recommended for key separation.

### Health Check

```bash
curl http://localhost:3000/api/health
```
