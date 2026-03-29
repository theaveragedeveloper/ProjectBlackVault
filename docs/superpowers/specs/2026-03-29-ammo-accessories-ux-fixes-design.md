# Design: V1.0.2 UX Fixes — Ammo, Accessories & Alerts

**Date:** 2026-03-29
**Branch:** V1.0.2-public-release
**Status:** Approved

---

## Overview

Five targeted UX fixes across the ammo and accessories sections. Issue 4 requires adding three optional fields to `AmmoTransaction` in the Prisma schema. All other changes are frontend or existing-API adjustments.

---

## Issue 1 — Battery Alert Deep Link

**Problem:** The battery change alert displays the accessory name but is not clickable. Users must manually navigate to find the accessory.

**Root cause:** In `src/components/dashboard/DashboardClient.tsx`, the overdue and due-soon battery alert `<Link>` elements hardcode `href="/accessories"` (the list page). The `BatteryDueItem` interface already includes the `id` field.

**Fix:** In `DashboardClient.tsx`, change both battery alert link hrefs from `/accessories` to `/accessories/[item.id]`.

**Acceptance criteria:**
- Tapping/clicking a battery change alert navigates directly to `/accessories/[id]`
- Works on mobile (390px) and desktop

---

## Issue 2 — Ammo Edit Button

**Problem:** There is no way to edit an existing ammo stock entry's metadata. The only options are Add Rounds and Log Use.

**Fix:** Add an Edit button to each stock row on `/ammo`. Clicking it opens a modal pre-populated with the stock's current values.

**Editable fields (NOT quantity — managed via transactions):**
- Caliber
- Brand
- Bullet Type
- Grain Weight
- Storage Location
- Low Stock Alert threshold
- Notes

**Implementation:**
- New `EditAmmoModal` component in `src/app/ammo/page.tsx` (same pattern as `AddRoundsModal`)
- Calls `PUT /api/ammo/[id]` — this handler already accepts all listed fields and returns the full updated stock object
- On success, replace the stock entry in local state using the returned object (no page reload)

**Acceptance criteria:**
- Edit button visible on each stock row
- Modal opens pre-populated with current values
- Saving updates the row in-place and closes the modal

---

## Issue 3 — Accessory Image Upload

**Problem:** In the build configurator (`/vault/[id]/builds/[buildId]/page.tsx`), the accessory image field is a plain `<input type="text">` for a URL instead of a file upload.

**Fix:** Replace the URL text input with `<ImagePicker entityType="accessory" entityId={slot.accessoryId} value={imageUrl} onChange={(url) => setImageUrl(url)} />`.

**ImagePicker contract:**
- `entityType="accessory"` — routes uploads to the correct storage path
- `entityId` — the existing accessory's ID (available as `slot.accessoryId` in the build slot form)
- `value` — the current `imageUrl` string from local state (or `null`)
- `onChange(url, source)` — called with the new URL after upload completes; store `url` in the same `imageUrl` state field that was previously bound to the text input
- The component calls `POST /api/images/upload` internally; no additional API wiring needed in the parent form

**Acceptance criteria:**
- No URL text input appears when editing an accessory image in the build configurator
- File upload (drag-and-drop or click) works; image preview displays after upload
- Saved accessory reflects the new image

---

## Issue 4 — Add Rounds Modal: Purchase Details

**Problem:** The `AddRoundsModal` only captures quantity and a note. Purchase price and date are lost when restocking.

**Schema change** (`prisma/schema.prisma`) — add three optional fields to `AmmoTransaction`:
```prisma
model AmmoTransaction {
  // existing fields unchanged ...
  purchasePrice    Float?
  pricePerRound    Float?
  purchaseDate     DateTime?
}
```
`purchaseDate` uses `DateTime?` (consistent with the rest of the schema) and is passed from the API as an ISO 8601 string, converted with `new Date()` before writing to Prisma.

**API change:** `POST /api/ammo/[id]/transactions` — accept optional `purchasePrice: number`, `pricePerRound: number`, and `purchaseDate: string` in the request body; write them to the new fields.

**UI change:** `AddRoundsModal` gains three optional fields below the quantity input:
- **Total Cost** (`purchasePrice`) — dollar amount
- **Price Per Round** (`pricePerRound`) — auto-calculated as `totalCost / quantity`, editable; same two-way auto-calc as `/ammo/new`
- **Purchase Date** (`purchaseDate`) — date input

All three fields are optional. If omitted, the transaction is created as before.

**Acceptance criteria:**
- Price and date fields are optional — existing Add Rounds flow works without them
- Auto-calculation between total cost and price per round works
- All three fields are persisted to the `AmmoTransaction` record when provided

---

## Issue 5 — Duplicate Ammo Merge Prompt

**Problem:** Creating a new ammo entry with the same identifying fields creates a duplicate record instead of adding to existing stock.

**Duplicate check — timing:** The check runs **on form submit only** (not live as fields are typed). Before calling `POST /api/ammo`, the client fetches `GET /api/ammo` to retrieve all existing stocks, then filters client-side for a match.

**Match criteria:** All four fields must match exactly:
- `caliber` (string, case-insensitive)
- `brand` (string, case-insensitive)
- `grainWeight` (float or null — `null` matches `null`, non-null matches same value)
- `bulletType` (string or null — same null-equals-null rule)

If a match is found, show an inline confirmation prompt instead of submitting:

> "You already have [Brand] [Caliber] [Grain]gr [BulletType] in stock ([X] rds). Add these rounds to existing stock instead?"
>
> **[Yes, add to existing]** &nbsp; **[No, create separate lot]**

**Yes, add to existing:** Post a `PURCHASE` transaction to `POST /api/ammo/[matchId]/transactions` carrying the quantity, purchasePrice, pricePerRound, and purchaseDate values from the form. Redirect to `/ammo` on success.

**No, create separate lot:** Proceed with the original `POST /api/ammo` create and redirect as normal.

**Acceptance criteria:**
- Prompt only appears when all four identifying fields match an existing record (including null-equals-null)
- "Yes" path creates a transaction, no duplicate record is created, user is redirected to `/ammo`
- "No" path creates a new record as before
- If no match exists, form submits normally with no prompt

---

## Files Affected Summary

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardClient.tsx` | Battery alert links → `/accessories/[item.id]` |
| `src/app/ammo/page.tsx` | Add `EditAmmoModal` + edit button on stock rows; expand `AddRoundsModal` with purchase fields |
| `src/app/api/ammo/[id]/transactions/route.ts` | Accept and store `purchasePrice`, `pricePerRound`, `purchaseDate` |
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Replace URL text input with `ImagePicker` for accessory image |
| `src/app/ammo/new/page.tsx` | Add submit-time duplicate detection + merge prompt |
| `prisma/schema.prisma` | Add `purchasePrice`, `pricePerRound`, `purchaseDate` to `AmmoTransaction` |

---

## Out of Scope

- Editing quantity directly on an ammo stock record (use transactions)
- Merging existing duplicate records retroactively
- Transaction history display UI changes
- Adding `caliber`/`brand` query param filtering to `GET /api/ammo` (client-side filter is sufficient)
