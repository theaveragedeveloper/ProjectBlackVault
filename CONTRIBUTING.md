# Contributing to ProjectBlackVault

Thanks for your interest in contributing! ProjectBlackVault is a self-hosted, privacy-first app and we want to keep it that way. Here's how to get involved.

## Ways to Contribute

- **Bug reports** — Found something broken? [Open a bug report](../../issues/new?template=bug_report.yml)
- **Feature requests** — Have an idea? [Open a feature request](../../issues/new?template=feature_request.yml)
- **Code contributions** — Fix a bug or implement a feature via pull request
- **Documentation** — Improve the README, add examples, fix typos

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Git

### Local Development Setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/your-username/ProjectBlackVault.git
cd ProjectBlackVault

# 2. Install dependencies
npm install

# 3. Set up your local environment
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Set up the database
npx prisma migrate dev

# 5. Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Development Workflow

1. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b fix/login-rate-limit
   git checkout -b feat/export-to-csv
   ```

2. **Make your changes.** Keep commits focused and atomic.

3. **Run the quality gate** before pushing:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run build
   ```

4. **Open a pull request** against `main`. Fill out the PR template completely.

## Code Standards

- **TypeScript** — Strict mode is enforced. No `any` types.
- **ESLint** — Run `npm run lint` and fix all errors before submitting.
- **Tests** — Add or update tests for any logic changes. Run `npm run test`.
- **Privacy first** — No telemetry, no external API calls, no cloud dependencies.
- **Self-hosted focus** — Features should work fully offline and without accounts.

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR
- Include a clear description of what changed and why
- Reference any related issues (e.g., `Closes #42`)
- Ensure the quality gate passes (CI will check this automatically)
- For significant changes, open an issue first to discuss the approach

## Reporting Security Issues

Please **do not** open a public issue for security vulnerabilities. Instead, review our [Security Policy](SECURITY.md) for responsible disclosure guidance.

## Questions?

Open a [GitHub Discussion](../../discussions) or ask in an issue. We're happy to help.
