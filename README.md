# ProjectBlackVault

**Private, self-hosted firearms and training records on your own hardware.**

ProjectBlackVault helps you keep inventory, maintenance, training, documents, and photos in one local system you control.

---

## Who this is for

ProjectBlackVault is built for people who want a practical, private record system without relying on cloud accounts.

- Home server and NAS users
- Self-hosters who prefer local-only services
- Anyone tracking inventory, maintenance, and training progress

---

## What you can do

- Track firearms and accessories
- Log round counts and drill sessions
- Review maintenance status and history
- Store local documents and photos
- Export records as PDF or CSV
- Configure local-network mobile access from **Settings**

---

## Features at a Glance

| Section | What it does |
|---------|-------------|
| **Vault** | Track every firearm — make, model, caliber, serial, value, photos |
| **Builds** | Configure accessory loadouts per firearm and mark one active |
| **Accessories** | Inventory optics, lights, suppressors, grips with round count tracking |
| **Ammo** | Stock tracking with low-alert thresholds and transaction history |
| **Range** | Log sessions, track drills, calculate hit factor, build drill templates |
| **Documents** | Store manuals, receipts, and permits per firearm or accessory |
| **Exports** | Generate PDF/CSV armory reports for insurance or records |
| **Settings** | QR-code mobile access — open BlackVault on your phone over Wi-Fi |

---

## Quick start (Docker)

> Recommended install path for V1.

### 1) Install prerequisites

- [Docker Engine](https://docs.docker.com/engine/install/)
- Docker Compose plugin

### 2) Clone and start

```bash
git clone <YOUR_REPO_URL>
cd ProjectBlackVault
git checkout V1-pub-release
docker compose up -d --build
```

### 3) Open ProjectBlackVault

Open:

- `http://localhost:3000`

If you changed the host port in `docker-compose.yml`, use that port instead.

> **Environment variables:** See `.env.example` for all available configuration options.

---

## Mobile access (local network)

Use this when opening ProjectBlackVault from a phone or tablet on the same Wi-Fi/LAN.

1. Open **Settings** in ProjectBlackVault.
2. Enter a **Mobile Access Host/IP** (example: `192.168.1.50`).
3. Save settings.
4. Use the displayed mobile URL (or copy it with the **Copy URL** button).

Tip: reserve a static/DHCP IP on your router so mobile access stays consistent.

---

## Updating to the latest `V1-pub-release`

Run this exact flow from your existing `ProjectBlackVault` folder:

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

## Backup and portability

- Use built-in exports for PDF/CSV backups
- Keep regular host-level backups of your Docker data folders

Because ProjectBlackVault is self-hosted, your data remains under your control.

---

## Self-hosting notes

- Designed for local/self-managed environments
- No cloud dependency is required for core use
- You control network exposure and backup strategy

---

## Troubleshooting

**Port 3000 is already in use**
Edit `.blackvault.env` and change `PORT=3000` to another port (e.g. `PORT=3001`), then restart:
```bash
docker compose down && docker compose up -d
```

**Can't access BlackVault from my phone**
1. Make sure your phone is on the same Wi-Fi network as the server
2. Open **Settings** in BlackVault and check the detected LAN IP
3. If the IP is wrong, enter your server's local IP manually (find it with `ip addr` on Linux or `ipconfig` on Windows)
4. Make sure your firewall allows inbound traffic on port 3000

**Database permission errors on startup**
The data directory must be writable by the container. Run:
```bash
chmod -R 755 ./data
```

**Container keeps restarting**
Check logs for errors:
```bash
docker compose logs -f
```

**How do I back up my data?**
Your entire vault is in `./data/db/vault.db` (SQLite). Copy that file to back it up. The app also has PDF/CSV export under Settings → Full Armory Export.

---

## Support

- Use GitHub Issues for bug reports and feature requests
- Include OS, Docker version, and command output when reporting setup/runtime issues

---

## License

Add your chosen license (for example MIT or Apache-2.0) and include a `LICENSE` file at the repository root.
