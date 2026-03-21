# RELEASE_NOTES_V1.md

## ProjectBlackVault V1.0.0

ProjectBlackVault V1 is a Docker-first, self-hosted release for home server/on-prem users who want private local control of their records.

## V1 Support Scope

- Supported public install/update path: Docker Compose
- Public V1 is Docker-only
- Desktop/downloader/installer flow is not the supported public V1 path

## Highlights

- Improved first-run setup reliability and password validation.
- Runtime configuration validation for safer startup.
- Health endpoint now verifies both config and database readiness.
- Upgraded Next.js toolchain to `16.2.0` and cleared current npm audit findings.
- Docker publish workflow improved for tags and multi-architecture images.
- Release/QA/support documentation set added for maintainers and end users.
- CI quality gate added (lint, typecheck, tests, build, Prisma checks).

## User-Facing Improvements

- Clearer setup/login error handling.
- Docker-first onboarding documentation for non-technical users.
- Safer network default (`localhost` unless explicitly enabled).
- Better backup and recovery guidance.

## Security And Data Safety

- Strict startup checks for critical environment values.
- Encryption key format validation.
- Session secret length validation.
- `.env` and local secret files ignored by git by default.

## Upgrade Notes

Preferred V1 upgrade path:

```bash
docker compose up -d --build
```

After upgrade, verify health:

```bash
curl -fsS http://localhost:3000/api/health
```

If you use custom settings (for example encryption key), keep `.env` backed up with your data folder.

Legacy `install.sh`/`install.bat` and `update.sh`/`update.bat` scripts may still exist for compatibility, but Docker Compose is the public V1 support path.

## Known Limitations (V1)

- No one-click restore wizard yet.
- Login rate limiting is single-instance in-memory.
- Manual smoke testing remains required before release.
