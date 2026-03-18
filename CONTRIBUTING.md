# Contributing to Project Black Vault

Thanks for your interest in improving Project Black Vault.

## Development Setup

```bash
git clone https://github.com/theaveragedeveloper/ProjectBlackVault.git
cd ProjectBlackVault
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Branch and PR Workflow

1. Create a branch from `main`.
2. Make focused, reviewable changes.
3. Run quality checks before opening a PR.
4. Open a PR using the provided template.

## Quality Gate (Required)

Run the following locally:

```bash
npm run lint
npm run typecheck
npm test
```

## Commit Message Style

Use short, descriptive commit messages with a scope prefix when possible, for example:

- `docs: improve onboarding README`
- `fix(api): validate session rotation input`
- `feat(ui): add vault quick actions`

## Reporting Bugs & Requesting Features

Please use the issue templates:

- Bug reports: `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature requests: `.github/ISSUE_TEMPLATE/feature_request.md`

## Security Issues

Do **not** open public issues for sensitive security reports.

Follow the disclosure process in [SECURITY.md](SECURITY.md).

## Code of Conduct

All contributors are expected to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
