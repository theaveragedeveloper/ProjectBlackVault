# ProjectBlackVault

**Private, self-hosted firearms and training records—running on your own machine with Docker.**

ProjectBlackVault gives you one local place to track firearms, accessories, maintenance, training, documents, and photos without relying on a cloud account.

---

## What ProjectBlackVault is

ProjectBlackVault is a self-hosted web application for managing firearm-related records at home. You can run it on a local machine, home server, or NAS using Docker.

It is built for users who want practical inventory and performance tracking while keeping ownership of their data.

---

## Why it is useful

- **Keeps everything in one place:** inventory, parts, records, and training notes.
- **Improves visibility:** quickly see round counts, maintenance status, and drill history.
- **Supports better decisions:** use drill-first performance history and logs to review progress over time.
- **Protects privacy:** runs locally; no cloud dependency is required for core use.
- **Makes backup and reporting easier:** export records as PDF or CSV when needed.

---

## Core features

- Firearm and accessory tracking
- Per-item and session-based round count tracking
- Drill logging with drill-first performance history
- Maintenance visibility and status tracking
- Document and photo uploads stored locally
- PDF and CSV export tools
- Local network/mobile access configuration from **Settings**

---

## Quick start (Docker, easiest V1 path)

> This is the recommended install path for V1.

### 1) Install prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/) + Docker Compose plugin

### 2) Clone and start

```bash
git clone <YOUR_REPO_URL>
cd ProjectBlackVault
git checkout V1-pub-release
docker compose up -d --build
```

### 3) Open the app

Open your browser to:

- `http://localhost:3000`

If your host uses a different port in `docker-compose.yml`, use that port instead.

---

## Mobile / LAN access

ProjectBlackVault can be used from phones and tablets on your local network.

1. Open **Settings** in the app.
2. Set your **Mobile Access Host/IP** (for example: `192.168.1.50`).
3. Save settings.
4. On mobile, open `http://<your-host-ip>:3000` (or your configured port).

Tip: Use a static IP or DHCP reservation on your router for more reliable LAN access.

---

## What you can track

- Firearms (details, photos, associated records)
- Accessories and attachments
- Round count history
- Drill sessions and performance notes
- Maintenance-related visibility across your inventory
- Uploaded documents (receipts, manuals, records) and photos

---

## Export and backup

ProjectBlackVault supports:

- **PDF exports** for printable/shareable records
- **CSV exports** for spreadsheet workflows and long-term portability

Because it is self-hosted, your data stays under your control. Standard host-level backups (NAS snapshots, disk backups, etc.) work well alongside app exports.

---

## Self-hosting notes

- Designed for local/self-managed use on home infrastructure.
- No cloud dependency is required for core functionality.
- Docker-based deployment keeps setup and updates consistent.
- You are responsible for network exposure and local backup strategy.

---

## Updating (V1-pub-release)

Use this exact update flow:

```bash
git checkout V1-pub-release
git fetch origin
git reset --hard origin/V1-pub-release
git clean -fd
docker compose down -v --remove-orphans || true
docker compose build --no-cache
docker compose up -d
```

---

## Who it is for

ProjectBlackVault is for people who want private, local control of their records, especially:

- Home server and NAS users
- Self-hosters who prefer local-only services
- Individuals tracking inventory, maintenance, and training progress

---

## Support / issues

- Use GitHub Issues to report bugs or request features.
- Include your environment details (OS, Docker version, logs) when reporting problems.
- For setup help, share the exact command you ran and its output so issues can be diagnosed faster.

---

## License

Add your project license here (for example, MIT, Apache-2.0, or a private/internal license), and include a `LICENSE` file in the repository root.
