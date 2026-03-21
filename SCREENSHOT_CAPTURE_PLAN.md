# Screenshot Capture Plan (V1 Public Docs)

Screenshots are intentionally not embedded yet. Use this plan to capture final product-quality images before broad public distribution.

## Goal

Produce a small, clear set of screenshots that matches the Docker-only V1 docs for non-technical users.

## Capture Environment

- Build from `V1-Public-release-check`
- Fresh data folder (first-run state available)
- Browser zoom 100%
- Desktop capture at 1440px wide (minimum)
- Mobile capture from same LAN for network access proof

## Required Screenshots

1. Docker running + successful start command output (`docker compose up -d --build` complete)
2. First-run setup screen (create master password)
3. Post-setup login screen
4. Main dashboard after successful login
5. Settings page showing network access URL/IP
6. Data folder layout showing `data/db` and `data/uploads`
7. Health check success command output (`/api/health`)

## Naming Convention

Store in `public/docs/` using:

- `v1-01-docker-start.png`
- `v1-02-first-run-setup.png`
- `v1-03-login.png`
- `v1-04-dashboard.png`
- `v1-05-network-access.png`
- `v1-06-backup-folders.png`
- `v1-07-health-check.png`

## Quality Rules

- No personal or sensitive data visible
- Keep text readable at normal zoom
- Do not include unrelated apps/windows
- Use consistent light/dark mode across all captures
- Re-capture if UI changed after release fixes

## Publication Checklist

1. Add final screenshots to `README.md` and `NON_TECHNICAL_INSTALL.md` at matching steps.
2. Re-verify every screenshot still matches current UI text and flow.
3. Confirm links/paths shown in screenshots match default Docker install flow.
