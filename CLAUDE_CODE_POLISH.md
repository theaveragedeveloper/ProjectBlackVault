# Project Black Vault — Final V1 Polish Pass

Branch: `V1-public-release-prep`
App: Self-hosted firearms tracker. Next.js, Tailwind v4, Prisma, Docker.
Build: already passes clean.

## Do these in order. Be concise.

### 1. Remove dead code from auth/login route
Open `src/app/api/auth/login/route.ts`.
Remove these unused functions — they were merged in from another branch and are never called:
- `parseBooleanEnv`
- `shouldUseSecureCookie`
- `MAX_TRACKED_IPS` constant

### 2. Fix verifyPassword call
In `src/app/api/auth/login/route.ts`, find:
```
const passwordValid = await verifyPassword(password, storedPassword);
```
The function is synchronous — remove the `await`. Change to:
```
const passwordValid = verifyPassword(password, storedPassword);
```

### 3. Remove console.log from API routes
```bash
grep -rn "console\.log" src/app/api/ --include="*.ts"
```
Remove any `console.log` lines found. Keep `console.error` inside catch blocks only.

### 4. Verify .gitignore covers build artifacts
Open `.gitignore`. Confirm these are present:
- `.next/`
- `.next.bak*/`
- `node_modules/`
- `data/`
- `session-secret`

Add any that are missing.

### 5. Check .env.example is complete
Open `.env.example`. Confirm these vars exist with descriptions:
- `SESSION_SECRET`
- `DATA_PATH`
- `DATABASE_URL`
- `NODE_ENV`

Add any missing with a short comment.

### 6. Final build check
```bash
npm run build
```
Must pass. Fix any errors.

### 7. Commit and push
```bash
git add -A
git commit -m "polish: remove dead code, clean console.logs, verify env docs"
git push origin V1-public-release-prep
```

## Output
One line per step: `✓ Step N — [what you did]` or `⚠️ Step N — [decision needed]`
