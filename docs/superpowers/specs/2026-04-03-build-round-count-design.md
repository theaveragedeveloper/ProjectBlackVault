# Build Round Count — Design Spec

**Date:** 2026-04-03
**Status:** Approved

## Problem

There is no way to track how many rounds have been fired through a specific build configuration. Accessories track round counts individually, but the build as a whole has no counter. Users also have no way to record rounds fired before they started using the app.

## Goal

Add a round count to each build that combines:
1. Manually added rounds (including pre-app backfill)
2. Rounds automatically derived from linked range sessions

Include a log of all manual additions with optional notes, and a unified timeline of both manual entries and range sessions.

---

## Schema Changes

### `Build` model — add field
```prisma
roundCount Int @default(0)   // stores manually-added rounds only
roundCountLogs BuildRoundCountLog[]
```

### New model: `BuildRoundCountLog`
```prisma
model BuildRoundCountLog {
  id            String   @id @default(cuid())
  buildId       String
  build         Build    @relation(fields: [buildId], references: [id], onDelete: Cascade)
  roundsAdded   Int
  previousCount Int
  newCount      Int
  sessionNote   String?
  loggedAt      DateTime @default(now())

  @@index([buildId])
  @@index([loggedAt])
}
```

**Displayed total** = `Build.roundCount` (manual) + sum of all linked `RangeSession.roundsFired` (derived at fetch time).

---

## API

### `GET /api/builds/[buildId]/round-count`
Returns the full round count state for a build.

**Response:**
```json
{
  "manualRoundCount": 300,
  "sessionRoundCount": 1200,
  "totalRoundCount": 1500,
  "logs": [
    {
      "type": "manual",
      "roundsAdded": 300,
      "previousCount": 0,
      "newCount": 300,
      "sessionNote": "Pre-app backfill",
      "loggedAt": "2026-01-15T00:00:00Z"
    },
    {
      "type": "session",
      "roundsAdded": 200,
      "sessionId": "clxxx",
      "location": "Redwood Range",
      "sessionDate": "2026-02-10T00:00:00Z"
    }
  ]
}
```

Logs are sorted by date descending (newest first). Manual entries use `BuildRoundCountLog`; session entries are derived from `RangeSession` records where `buildId` matches.

### `POST /api/builds/[buildId]/round-count`
Adds rounds manually to the build.

**Request body:**
```json
{
  "roundsAdded": 100,
  "sessionNote": "Optional note"
}
```

**Behavior:**
- Reads current `Build.roundCount`
- Creates `BuildRoundCountLog` entry with `previousCount`, `newCount`
- Updates `Build.roundCount` atomically in a Prisma transaction
- Returns updated `{ manualRoundCount, sessionRoundCount, totalRoundCount }`

The log is append-only — no DELETE on individual entries.

---

## UI — Build Configurator Page (`/vault/[id]/builds/[buildId]`)

### Round Count Display

Added to the build info area (near name/description):

```
[  1,500 rounds  ]
1,200 from range sessions · 300 manually added
                              [ + Add Rounds ]
```

- Total displayed in a prominent stat style consistent with the rest of the app
- Breakdown line in `text-vault-text-muted` below
- `+ Add Rounds` button in teal (`#00C2FF`)

### Add Rounds Inline Form

Clicking `+ Add Rounds` expands an inline form below the button (no modal):

- **Rounds fired** — number input, required
- **Note** — text input, optional (placeholder: "e.g. Pre-app backfill, training day")
- **Add** and **Cancel** buttons

On submit: POST to `/api/builds/[buildId]/round-count`, refresh the count display and log.

### Round Count Log (collapsible)

Below the count display, a collapsible section triggered by a chevron:

- **Collapsed by default**, labeled "Round Count Log"
- When expanded, shows a unified timeline (newest first) of:
  - **Manual entries:** rounds added, note, date
  - **Range sessions:** location, rounds fired, date — links to the session in Range > Session History
- Visual distinction between entry types (e.g. a small badge: "Manual" vs "Session")
- Matches the collapsible pattern used by the maintenance log on the firearm detail page

---

## Files to Change

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `roundCount` to `Build`, add `BuildRoundCountLog` model |
| `src/app/api/builds/[buildId]/round-count/route.ts` | New file — GET and POST handlers |
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Add round count display, add rounds form, log section |

Run `npx prisma migrate dev` after schema changes.

---

## Out of Scope

- Editing or deleting individual log entries
- Build-level round count alerts or maintenance intervals (separate feature)
- Displaying build round count on the vault card or firearm detail page
