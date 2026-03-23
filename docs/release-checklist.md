# BlackVault V1 Release Checklist

This checklist is for **self-hosted** V1 release readiness only.

## 1) Product & Messaging

- [ ] README describes BlackVault as self-hosted software.
- [ ] No cloud/SaaS dependency is required to run core features.
- [ ] Install paths and Docker-first setup flow are documented.

## 2) Install & Upgrade Paths

- [ ] Linux/macOS setup tested with `./install.sh`.
- [ ] Windows setup tested with `install.bat`.
- [ ] Update path documented with `./update.sh` (and `update.bat` on Windows).
- [ ] Generated `.blackvault.env` includes `DATA_DIR`, `PORT`, and `VAULT_ENCRYPTION_KEY`.

## 3) Containerization

- [ ] `Dockerfile` builds with multi-stage flow (deps → builder → runner).
- [ ] Runtime runs as non-root user.
- [ ] Prisma migrations run on container startup.
- [ ] `docker-compose.yml` mounts persistent DB and uploads directories.
- [ ] Healthcheck endpoint `/api/health` is configured.

## 4) Release Validation Commands

Run from repository root:

```bash
npm run lint
npm run build
docker compose config
```

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `docker compose config` passes.

## 5) Release Blockers

Mark any blocker found during validation:

- [ ] None
- [ ] Blockers documented below

### Blocker Notes

- _None at this time._
