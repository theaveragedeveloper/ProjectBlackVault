# BlackVault V1 Release — Claude Code Task Brief

This is a self-hosted firearms inventory and range tracking app built with Next.js 15,
Prisma, SQLite, and Tailwind. It runs via Docker Compose. The dev server is at
http://localhost:3000. All source is in `src/`, schema is in `prisma/schema.prisma`.

## How to run

```bash
npm run dev          # start dev server
npx prisma studio    # inspect the database
```

## Your job

Complete all tasks below in order. After each task, verify the change works before
moving to the next. Where the task says "test on mobile width", resize the browser
to 390px wide to check.

---

## TASK 1 — Remove encryption (plain text serial numbers)

**Goal:** Serial numbers are currently stored as `enc:...` blobs and never decrypted
before display. V1 ships with no encryption. Make serial numbers plain text everywhere.

**Files to change:**

### 1a. `src/lib/crypto.ts`
Replace the entire file with a clean passthrough implementation that:
- Makes `encryptField(value)` return `value` unchanged
- Makes `decryptField(value)` return the value unchanged if it doesn't start with `enc:`
- If the value DOES start with `enc:`, attempt to decrypt it using `VAULT_ENCRYPTION_KEY`
  from the environment (for backward compat with any existing data) — the existing
  decryption logic is correct, keep it in `decryptField` only
- Remove all imports of `createCipheriv` and `randomBytes` since encryption is gone

### 1b. `src/app/api/firearms/route.ts`
- The `decryptField` import and call on `serialNumber` in GET is already in place from
  a previous partial fix — verify it's correct
- In the POST handler, the `serialNumber` is written as plain text already (no encrypt
  call) — verify this is the case and no `encryptField` call exists

### 1c. `src/app/vault/[id]/page.tsx`
- Find the line rendering `firearm.serialNumber` directly (around line 192)
- Wrap it: `{decryptField(firearm.serialNumber) ?? "—"}`
- Add `import { decryptField } from "@/lib/crypto"` at the top with the other imports

### 1d. `src/app/api/exports/full-armory/route.ts`
- Find `resolvedSerial` (around line 381) where `firearm.serialNumber` is used directly
- Wrap with `decryptField()`: `decryptField(firearm.serialNumber) ?? firearm.serialNumber ?? ""`
- Add `import { decryptField } from "@/lib/crypto"` at the top

### 1e. Write a one-time migration script: `scripts/decrypt-serials.ts`
This script should:
- Connect to the Prisma DB
- Find all firearms where `serialNumber` starts with `enc:`
- Decrypt each one using `decryptField` from `@/lib/crypto`
- Update the record with the plain text value
- Log each update: `Decrypted serial for firearm: [name]`
- Be safe to run multiple times (idempotent)

Add this to `package.json` scripts:
```json
"decrypt-serials": "npx ts-node --project tsconfig.json scripts/decrypt-serials.ts"
```

**Test:** Start dev server, go to /vault — serial numbers should show plain text, not `enc:...`

---

## TASK 2 — Fix 503 errors on mobile/LAN (SQLite concurrency)

**Goal:** When navigating quickly on mobile/LAN, Next.js RSC prefetching fires multiple
concurrent Prisma queries against SQLite, causing 503s on Accessories, Builds, and
Vault detail pages.

### 2a. `docker-compose.yml` and `docker-compose.dev.yml`
- Both already have `connection_limit=1` appended to `DATABASE_URL` from a previous fix
- Verify both files have: `DATABASE_URL=file:/app/data/vault.db?connection_limit=1`

### 2b. `src/app/accessories/page.tsx`
The `getAccessories()` function is called at the top level with no error boundary.
Wrap the entire `export default async function AccessoriesPage()` body in a try/catch:
- On error, return a simple error UI:
```tsx
<div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
  <p className="text-vault-text-muted text-sm">Failed to load accessories.</p>
  <a href="/accessories" className="text-[#00C2FF] text-sm hover:underline">Tap to retry</a>
</div>
```

### 2c. `src/app/builds/page.tsx`
Same pattern — wrap the page body in try/catch with the same retry UI.

### 2d. `src/app/vault/[id]/page.tsx`
The `getFirearm()` call already has a `notFound()` guard but no error boundary.
Add a try/catch around the Prisma call in `getFirearm()` — on error, throw so
Next.js shows the error boundary, or return null and show the retry UI.

**Test:** Navigate rapidly between pages in a 390px window — no blank 503 pages.

---

## TASK 3 — LAN access: QR code + prominent URL display

**Goal:** Non-technical users on the same WiFi can't easily find the URL to open
BlackVault on their phone. Fix this with a QR code and a more prominent LAN URL.

### 3a. `src/app/settings/page.tsx`
In the "Mobile Access (Local Network)" section, after the Mobile URL box:
- Add a QR code rendered in the browser using `qrcode` npm package
- Install it: `npm install qrcode` and `npm install --save-dev @types/qrcode`
- When `finalLanUrl` is available, render a QR code as a `<canvas>` or `<img>` element
  below the URL text using `QRCode.toDataURL(finalLanUrl)`
- Size: 160×160px, centered, with a small caption: "Scan to open on your phone"
- Only show the QR code when `finalLanUrl` is non-empty

### 3b. `src/app/page.tsx` (Command Center / dashboard)
- Fetch the LAN URL from `/api/network/local-access` on mount (same as Settings page does)
- If a LAN IP is detected AND the user is NOT accessing from localhost, show a dismissable
  banner at the top of the dashboard:
```
📱  Open on your phone: http://192.168.x.x:3000   [Copy]  [×]
```
- Store the dismissed state in `sessionStorage` so it doesn't re-appear on refresh
- The banner should be teal/cyan colored to match the app's accent color
- Only show this banner if `window.location.hostname` is NOT `localhost` or `127.0.0.1`
  (i.e. only when accessed via LAN IP — no need to show it when you're already on desktop)

**Test:** Access http://localhost:3000/settings — QR code should appear. Scan it from phone.

---

## TASK 4 — Range section: delete sessions + drill UX polish

**Goal:** Users need to delete test/unwanted sessions and drill results. The drill
library UI also needs a more polished, user-friendly look.

### 4a. `src/app/api/range/sessions/[id]/route.ts`
A DELETE handler has already been added in a previous session. Verify it exists and
works correctly:
- Should delete the session by ID
- Cascade delete handles `sessionDrills` and `ammoLinks` via Prisma schema relations
- Returns `{ success: true }` on success, 404 if not found

### 4b. `src/components/range/RangeWorkspace.tsx`

This is the main file to edit. It's 1,861 lines. Make the following targeted changes:

**4b-i. Session History — add delete button**
In the session history view (`view === "session-history"`), find each session row.
Add a delete button (trash icon, using `Trash2` from lucide-react) to each row.
- Show a small inline confirmation: clicking trash once shows "Delete?" text with
  a "Yes" and "Cancel" option in place of the button — no modal needed
- On confirm, call `DELETE /api/range/sessions/:id`
- On success, remove the session from local state (no full page reload)
- Show a brief success toast or inline message: "Session deleted"

**4b-ii. Session History — fix "View" button**
Currently "View" appears to do nothing useful for some sessions.
- Clicking "View" on a session should expand it inline to show:
  - Date, location, firearm, build, ammo used, total rounds
  - A table of drill sets if any exist (name, set #, time, HF)
  - If no drills: "No drills logged for this session"
- Only one session should be expanded at a time (clicking View on another collapses the current one)
- The expand/collapse should be smooth (use a simple show/hide with a chevron icon)

**4b-iii. Drill Library — remove "Logged Drill Names" column**
The right-hand "LOGGED DRILL NAMES" panel showing just a raw list of drill name strings
(e.g. "bill") is confusing. Remove it entirely.
Instead, on each template card in the TEMPLATE LIBRARY, show a small badge:
- Query how many SessionDrill records have a `name` matching this template's name
- Show: "X sessions logged" as a subtle badge/tag below the template description
- Fetch this count from `/api/range/drills?name=<templateName>` and use the response length

**4b-iv. Drill Library — localStorage warning banner**
At the top of the drill library section, add a clearly visible info banner:
```
ℹ  Drill templates are saved to this browser only.
   They won't appear on your phone or other devices.
```
- Style it as a subtle amber/yellow info box with a small info icon
- Include an "×" to dismiss it (store dismissal in localStorage key `bv-drill-lib-notice-dismissed`)

**4b-v. Drill Library — visual polish**
The current template cards use a dense flat layout. Improve them:
- Give each card a slightly elevated appearance (subtle border + hover state)
- Move the Select / Edit / History / Delete buttons into a row at the bottom of each card
  with consistent sizing — currently they're inconsistently sized and aligned
- Add the template's `mode` (TIME / ACCURACY / BOTH) as a small colored badge:
  - TIME → blue badge
  - ACCURACY → green badge  
  - BOTH → purple badge
- Add a subtle divider between the template info and the action buttons

**Test:** Go to Range > Session History — trash icon should appear. Go to Range > Drill Library
— notice banner should appear, cards should look polished, no "Logged Drill Names" column.

---

## TASK 5 — Form fixes

### 5a. `src/app/vault/new/page.tsx`
- Find the `lastMaintenanceDate` input (around line 290 in the Maintenance fieldset)
- Remove `defaultValue={new Date().toISOString().split("T")[0]}` — leave it blank
- A new firearm hasn't been serviced yet

### 5b. `src/app/vault/page.tsx` and `src/app/vault/[id]/page.tsx`
- Where `purchasePrice` or `currentValue` is `null` or `0`, display `—` instead of `$0`
  or `"No price"`
- In the vault card, find `"No price"` and replace with: `{firearm.purchasePrice ? formatCurrency(firearm.purchasePrice) : "—"}`
- In the detail page, find where price fields render `$0` or nothing — wrap with the same null check

**Test:** Add a new firearm — Last Maintenance should be blank. Vault card should show "—" not "$0".

---

## TASK 6 — Export preview table spacing (verify previous fix)

### 6a. `src/app/exports/full-armory/preview/page.tsx`
Verify that `pr-4` was correctly added to all `<th>` and `<td>` elements in the
Master Inventory table from a previous session. If not, add `pr-4` to each one.

Also verify that the serial number rendered in the table is now plain text (from Task 1).

**Test:** Go to Settings > Open Full Armory Exports > Open Preview.
The Master Inventory table should have proper column spacing and readable serial numbers.

---

## TASK 7 — Fix React hydration error #418

**Goal:** There's a hydration mismatch error firing on page load of the Command Center.

Run the dev server and check the browser console for the full error. The most likely
cause is a component using `Date` or `localStorage` during server-side render without
a `useEffect` guard.

Common fix pattern:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null // or return a skeleton
```

Find the component causing the mismatch (look for anything that reads
`new Date()`, `Date.now()`, `window.*`, or `localStorage.*` outside of `useEffect`)
and wrap it properly.

Check these files first:
- `src/app/page.tsx` (Command Center — "Last updated" timestamp is a prime suspect)
- `src/components/range/RangeWorkspace.tsx` (localStorage reads)
- Any component that renders a time/date on both server and client

**Test:** Hard reload http://localhost:3000 — no React error #418 in the console.

---

## TASK 8 — DB wipe script for release

**Goal:** A clean script to wipe all test data before publishing the Docker image.

### 8a. Create `scripts/reset-db.ts`
This script should:
- Print a warning: "This will permanently delete ALL data. Type CONFIRM to proceed:"
- Wait for stdin input — only proceed if the user types "CONFIRM"
- Delete all rows from every table in this order (to respect FK constraints):
  1. SessionDrill
  2. RangeSessionAmmoLink
  3. AmmoTransaction
  4. RangeSession
  5. RoundCountLog
  6. BuildSlot
  7. Build
  8. Document
  9. ImageCache
  10. Accessory
  11. AmmoStock
  12. Firearm
  13. AppSettings (skip this one — preserve settings)
- Log a count of deleted rows per table
- Print: "✓ Database reset complete. Ready for V1 release."

Add to `package.json`:
```json
"reset-db": "npx ts-node --project tsconfig.json scripts/reset-db.ts"
```

**Test:** Run `npm run reset-db` in dev — confirm it prompts before deleting.

---

## TASK 9 — Page title cleanup

### 9a. `src/app/layout.tsx`
Find the metadata export and change the title from `"Project BlackVault"` to `"BlackVault"`.
Update the description if it mentions "Project" anywhere.

---

## Notes for Claude Code

- The app uses path alias `@/` for `src/`
- All API routes use Next.js 15 App Router conventions (`route.ts`)
- The Prisma client is imported from `@/lib/prisma`
- All UI components follow the dark theme design system using CSS variables like
  `text-vault-text`, `bg-vault-surface`, `border-vault-border`
- The accent color is `#00C2FF` (cyan/teal)
- Error states use `#E53935` (red), success uses `#00C853` (green)
- Run `npx prisma generate` after any schema changes
- The app does NOT use tRPC — all data fetching is via `fetch()` to `/api/` routes
  or direct Prisma calls in Server Components

## What has already been done (do NOT redo)

- `docker-compose.yml` and `docker-compose.dev.yml` — `connection_limit=1` already added
- `src/app/api/firearms/route.ts` — `decryptField` import and call already added to GET
- `src/app/exports/full-armory/route.ts` — `decryptField` import and call already added
- `src/app/vault/[id]/page.tsx` — `decryptField` import already added
- `src/app/exports/full-armory/preview/page.tsx` — `pr-4` padding already added to table
- `src/app/api/range/sessions/[id]/route.ts` — DELETE handler already added
