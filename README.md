# Project Black Vault

> Private, offline-first firearms inventory, ammo, maintenance, and training tracker — fully self-hosted and controlled by you.

No cloud accounts. No external storage. No vendor lock-in.

![License](https://img.shields.io/badge/license-MIT-green)
![Self-hosted](https://img.shields.io/badge/self--hosted-yes-blue)
![Offline-first](https://img.shields.io/badge/offline--first-yes-informational)

## Download the Latest Desktop App

Get the newest desktop installers from GitHub Releases:
https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest

- **macOS:** download the `.dmg` installer
- **Windows:** download the `Project Black Vault-Setup.exe` installer
- **Home server users:** use the Docker deployment flow in this repository

> Installer signing status can vary by platform/release setup. If a build is unsigned, GitHub still serves it from this official releases page.

## Why Project Black Vault?

Most inventory workflows are split across spreadsheets, notes apps, and cloud tools.

Project Black Vault gives you a purpose-built system for:

- Firearms inventory and metadata
- Ammo stock and usage history
- Loadouts and configurations
- Maintenance and service tracking
- Training logs and performance trends
- Local backup and restore workflows

All data remains local to your machine or home server.

## Choose Your Setup

### 🖥 Desktop App (Easiest)
Best for single-computer use with minimal setup.

### 🐳 Docker / Home Server
Best for NAS or always-on environments with LAN/VPN access.

### 🛠 Run from Source (Advanced)
Best for developers and custom deployments.

## App Preview

> The repository owner provides screenshots at `public/readme/`.

![Dashboard](public/readme/dashboard.png)
![Vault](public/readme/vault.png)
![Ammo](public/readme/ammo.png)
![Range Sessions](public/readme/range-sessions.png)
![Settings](public/readme/settings.png)
![Backup](public/readme/backup.png)

## Releasing the Desktop App

Maintainers can cut a new desktop release by bumping `electron/package.json`, pushing a `v*` tag, and letting GitHub Actions publish installers automatically. See [`docs/releasing.md`](docs/releasing.md) for the full runbook.

## Quick Start (Developer)

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault

npm install
cp .env.example .env

npx prisma migrate dev
npm run dev
```

Open: http://localhost:3000

## Production-minded Setup Notes

- Keep `.env` / `.blackvault.env` private and out of source control.
- Set strong secrets for production (`SESSION_SECRET`, `PASSWORD_RECOVERY_SECRET`, and `VAULT_ENCRYPTION_KEY`).
- Back up your database and exported backups regularly.

## Trust & Project Standards

- 📜 [License (MIT)](LICENSE)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 🛡️ [Security Policy](SECURITY.md)
- ❤️ [Code of Conduct](CODE_OF_CONDUCT.md)
- 🗒️ [Changelog](CHANGELOG.md)

## Community & Support

- Feature requests and bug reports: [GitHub Issues](https://github.com/theaveragedeveloper/ProjectBlackVault/issues)
- Security disclosures: follow [SECURITY.md](SECURITY.md)

---

If this project helps you, consider starring the repository to support development.
