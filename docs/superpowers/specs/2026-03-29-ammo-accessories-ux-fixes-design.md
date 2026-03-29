# Design: V1.0.2 UX Fixes — Ammo, Accessories & Alerts

**Date:** 2026-03-29
**Branch:** V1.0.2-public-release
**Status:** Approved

---

## Overview

Five targeted UX fixes across the ammo and accessories sections. No schema changes required for issues 1–3. Issue 4 requires a new optional field on `AmmoTransaction`. Issue 5 is frontend-only detection logic.

---

## Issue 1 — Battery Alert Deep Link

**Problem:** The battery change alert displays the accessory name but is not clickable. Users must manually navigate to find the accessory.

**Fix:** Wrap each battery alert item in an `<a href="/accessories/[id]">` (or Next.js `<Link>`). The accessory `id` is available wherever the alert is rendered.

**Files to check:**
- `src/app/page.tsx` (Command Center dashboard alerts)
- `src/components/` — any battery alert component

**Acceptance criteria:**
- Tapping/clicking a battery change alert navigates directly to `/accessories/[id]`
- Works on mobile (390px) and desktop

---

## Issue 2 — Ammo Edit Button

**Problem:** There is no way to edit an existing ammo stock entry. The only options are Add Rounds and Log Use.

**Fix:** Add an Edit button to each stock row on `/ammo`. Clicking it opens a modal to update the stock's metadata fields.

**Editable fields (NOT quantity — that's managed via transactions):**
- Caliber
- Brand
- Bullet Type
- Grain Weight
- Storage Location
- Low Stock Alert threshold
- Notes

**Implementation:**
- New `EditAmmoModal` component in `src/app/ammo/page.tsx` (same pattern as `AddRoundsModal`)
- Calls `PUT /api/ammo/[id]` with updated fields
- On success, updates local state (no full page reload)

**Acceptance criteria:**
- Edit button visible on each stock row
- Modal opens pre-populated with current values
- Saving updates the stock and closes the modal

---

## Issue 3 — Accessory Image Upload

**Problem:** In some editing contexts (suspected: build configurator slot editor), the accessory image field shows a URL text input instead of the `ImagePicker` file upload component.

**Fix:** Locate all accessory edit surfaces and replace any URL text input with `<ImagePicker entityType="accessory" />`. The standalone `/accessories/[id]/edit/page.tsx` already uses `ImagePicker` correctly — the fix targets any other edit surface (e.g., build slot modal, inline edit).

**Files to investigate:**
- `src/app/vault/[id]/builds/[buildId]/page.tsx` — build configurator (most likely source)
- Any accessory edit modal rendered from a build context

**Acceptance criteria:**
- No URL text input appears when editing an accessory image in any context
- File upload (drag-and-drop or click) works consistently everywhere

---

## Issue 4 — Add Rounds Modal: Purchase Details

**Problem:** The `AddRoundsModal` only captures quantity and a note. Users cannot record the purchase price or date when restocking, losing cost tracking history.

**Fix:** Expand `AddRoundsModal` with optional purchase detail fields:
- **Total Cost** (dollar amount)
- **Price Per Round** (auto-calculated from total cost ÷ quantity, same as the new ammo form)
- **Purchase Date**

These are stored on the `AmmoTransaction` record. The `AmmoTransaction` model already has a `note` field; `purchasePrice`, `pricePerRound`, and `purchaseDate` need to be added as optional fields.

**Schema change** (`prisma/schema.prisma`):
```prisma
model AmmoTransaction {
  // existing fields ...
  purchasePrice    Float?
  pricePerRound    Float?
  purchaseDate     String?
}
```

**API change:** `POST /api/ammo/[id]/transactions` accepts and stores the three new optional fields.

**UI change:** `AddRoundsModal` gains the three fields below quantity, with the same auto-calc behavior as `/ammo/new`.

**Acceptance criteria:**
- Price and date fields are optional — existing Add Rounds flow still works without them
- Auto-calculation between total cost and price per round works
- Fields are saved and visible in transaction history

---

## Issue 5 — Duplicate Ammo Merge Prompt

**Problem:** Creating a new ammo entry with the same caliber + brand + grain weight + bullet type creates a duplicate stock record instead of adding to the existing one.

**Fix:** On the `/ammo/new` form, after the user fills in caliber + brand (the minimum identifying fields), query `GET /api/ammo?caliber=X&brand=Y` to check for existing matches. If a match is found on form submit, show an inline prompt before creating.

**Match criteria:** caliber + brand + grain weight + bullet type (all four must match for a "duplicate" — different grain weights are different lots).

**Prompt text:**
> "You already have [Brand] [Caliber] [Grain]gr [BulletType] in stock ([X] rds). Add these rounds to existing stock instead?"
>
> [Yes, add to existing] [No, create separate lot]

**Yes, add to existing:** Posts a `PURCHASE` transaction to `/api/ammo/[id]/transactions` with the quantity, price, and date from the form, then redirects to `/ammo`.

**No, create separate lot:** Proceeds with the original `POST /api/ammo` create flow.

**Acceptance criteria:**
- Prompt only appears when all four identifying fields match an existing record
- "Yes" path creates a transaction and redirects, no duplicate record created
- "No" path creates a new record as before
- If no match exists, form submits normally with no prompt

---

## Files Affected Summary

| File | Change |
|------|--------|
| `src/app/page.tsx` | Battery alert items become links to `/accessories/[id]` |
| `src/app/ammo/page.tsx` | Add `EditAmmoModal`, edit button on stock rows |
| `src/app/api/ammo/[id]/route.ts` | Verify `PUT` handler accepts all editable fields |
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Replace URL input with `ImagePicker` if present |
| `src/app/ammo/new/page.tsx` | Add duplicate detection + merge prompt |
| `src/app/api/ammo/new/page.tsx` | Add duplicate check query before submit |
| `prisma/schema.prisma` | Add `purchasePrice`, `pricePerRound`, `purchaseDate` to `AmmoTransaction` |
| `src/app/api/ammo/[id]/transactions/route.ts` | Accept and store new optional fields |
| `src/app/ammo/page.tsx` (`AddRoundsModal`) | Add purchase detail fields |

---

## Out of Scope

- Editing quantity directly on an ammo stock record (use transactions)
- Merging existing duplicate records retroactively
- Transaction history display changes
