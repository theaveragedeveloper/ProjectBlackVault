# Design: Accessory Round Count on Edit + Battery Change Log

**Date:** 2026-04-02
**Status:** Approved

---

## Context

Two gaps in the accessories workflow:

1. **Round count only settable at creation** — the "Prior Use" round count field exists on the new accessory form but not the edit form. Users who added accessories before the feature existed, or who skipped it, have no way to set a baseline.

2. **No battery change history** — the battery alert on the dashboard shows when a change is due, but logging a battery change has no visible entry point on the accessory detail page and leaves no history. Users want a log of when batteries were replaced, mirroring how round counts are tracked.

---

## Data Model

### New model: `BatteryChangeLog`

```prisma
model BatteryChangeLog {
  id          String    @id @default(cuid())
  accessoryId String
  accessory   Accessory @relation(fields: [accessoryId], references: [id], onDelete: Cascade)
  changedAt   DateTime  @default(now())
  batteryType String?
  notes       String?
  createdAt   DateTime  @default(now())

  @@index([accessoryId])
  @@index([changedAt])
}
```

Add relation to `Accessory` model:
```prisma
batteryChangeLogs BatteryChangeLog[]
```

`lastBatteryChangeDate` on `Accessory` remains the source of truth for the dashboard alert calculation. The new log route updates it on every entry.

---

## API Routes

### New: `src/app/api/accessories/[id]/battery-log/route.ts`

**POST** — Log a battery change
- Body: `{ changedAt?: string, batteryType?: string, notes?: string }`
- Creates `BatteryChangeLog` entry
- Updates accessory `lastBatteryChangeDate` to `changedAt` (defaults to `now()`) — resets dashboard alert
- If `batteryType` provided and differs from current value, updates `accessory.batteryType`
- Returns new log entry

**GET** — Fetch history
- Returns all `BatteryChangeLog` for the accessory, ordered by `changedAt` desc

### Updated: `GET /api/accessories/[id]`
- Include `batteryChangeLogs` in response (alongside existing `roundCountLogs`)

---

## UI Changes

### 1. Edit form — Prior Use round count
**File:** `src/app/accessories/[id]/edit/page.tsx`

- Add "Prior Use" section with number input: "Round Count from Prior Use" + optional notes field
- Only visible when `accessory.roundCount === 0` — prevents accidental double-counting
- On submit: fires `POST /api/accessories/[id]/rounds` with `{ rounds: N, note: "Prior use at time of entry" }`
- Identical to the section already on the creation form

### 2. Battery History section — Accessory detail page
**File:** `src/app/accessories/[id]/page.tsx`

- Only renders when `hasBattery === true`
- Mirrors the round count section pattern on this page:
  - Header: "Battery History" + "Log Change" button
  - Inline form (expands on click): Date (default today), Battery Type (pre-filled from `accessory.batteryType`), Notes (optional)
  - On save: `POST /api/accessories/[id]/battery-log` → refresh section
  - History table: Date | Battery Type | Notes, ordered newest first
  - Empty state: "No battery changes logged"
- Dashboard alert resets automatically since `lastBatteryChangeDate` is updated on the backend

---

## Critical Files

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `BatteryChangeLog` model + relation on `Accessory` |
| `src/app/api/accessories/[id]/battery-log/route.ts` | New file — POST + GET handlers |
| `src/app/api/accessories/[id]/route.ts` | Include `batteryChangeLogs` in GET response |
| `src/app/accessories/[id]/edit/page.tsx` | Add prior round count section |
| `src/app/accessories/[id]/page.tsx` | Add Battery History section |

---

## Verification

1. `npx prisma migrate dev --name add-battery-change-log` runs without error
2. Edit an existing accessory with `roundCount === 0` → "Prior Use" section appears; entering a value logs it and increments the count
3. Edit an accessory with `roundCount > 0` → "Prior Use" section is hidden
4. On an accessory with `hasBattery: true`, Battery History section is visible on detail page
5. Log a battery change → entry appears in history, `lastBatteryChangeDate` updates, dashboard alert resets
6. On an accessory with `hasBattery: false`, Battery History section does not render
