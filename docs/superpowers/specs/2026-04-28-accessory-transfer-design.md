# Accessory Transfer Between Builds — Design Spec

**Date:** 2026-04-28  
**Status:** Approved

## Problem

When assigning an accessory to a build slot, if the accessory is already assigned to an active build the API returns a 409 conflict. The UI shows a red error message but provides no recovery path — the user must close the modal, manually find the other build, remove the accessory there, then come back and reassign. This is disruptive when building out a new configuration that reuses accessories from an existing build.

## Goal

Allow the user to transfer an accessory from a conflicting build directly from the assignment modal, without leaving the current build editor.

## Design

### Trigger

The transfer UI appears inline in the existing error banner inside `AccessoryBrowserModal`, triggered when the `PUT /api/builds/[id]/slots` call returns a 409 with a `conflictingSlot` payload:

```json
{
  "error": "This accessory is already assigned to an active build slot (Build: \"X\", Slot: OPTIC)",
  "conflictingSlot": {
    "buildId": "...",
    "buildName": "Competition Setup",
    "slotType": "OPTIC"
  }
}
```

### New Client State

Add to `AccessoryBrowserModal`:

```ts
const [conflict, setConflict] = useState<{
  buildId: string
  buildName: string
  slotType: string
} | null>(null)

const [transferMode, setTransferMode] = useState<"leave-empty" | "remove-slot">("leave-empty")
const [transferring, setTransferring] = useState(false)
```

In `assignAccessory()`, on a 409 response, set both `assignError` (the message string) and `conflict` (the `conflictingSlot` object). Clicking a different accessory row or changing the search resets both.

### Transfer Card UI

When `conflict` is non-null, the error banner expands into a transfer card:

```
┌────────────────────────────────────────────────────────────┐
│ ⚠  Already in "Competition Setup" / Optic                  │
│                                                            │
│ What should happen to that slot?                           │
│ ○  Leave slot empty on "Competition Setup"   (default)     │
│ ○  Remove slot from "Competition Setup"                    │
│                                                            │
│                          [Cancel]  [Transfer →]            │
└────────────────────────────────────────────────────────────┘
```

- **Cancel** — resets `conflict` and `assignError` to null, no API calls
- **Transfer →** — executes the two-step transfer (shows spinner, disables both buttons)

### Transfer Execution (`transferAccessory`)

Two sequential API calls:

**Step 1 — Release from old build**

- If `transferMode === "leave-empty"`: `PUT /api/builds/[conflict.buildId]/slots` with `{ slotType: conflict.slotType, accessoryId: null }` — sets the slot's `accessoryId` to null, leaving the slot row intact.
- If `transferMode === "remove-slot"`: `DELETE /api/builds/[conflict.buildId]/slots?slotType=[conflict.slotType]` — deletes the `BuildSlot` row entirely.

**Step 2 — Assign to current build**

`PUT /api/builds/[buildId]/slots` with `{ slotType, accessoryId }` — same call as the normal assignment path.

**On success:** reset `conflict`, `assignError`, `transferMode`. Call `onAssigned()` to refresh build data. Do **not** call `onClose()` — the modal stays open so the user can continue assigning accessories.

**On failure (either step):** set `assignError` to the error message. Keep `conflict` populated so the user can retry or cancel.

### New Backend Route — DELETE /api/builds/[id]/slots

`src/app/api/builds/[id]/slots/route.ts` gains a `DELETE` handler:

- Reads `slotType` from query params (`?slotType=OPTIC`)
- Validates: returns 400 if `slotType` is missing or empty; returns 404 if the build doesn't exist
- Finds the `BuildSlot` row for `{ buildId, slotType }` and deletes it
- Returns `{ success: true, slotType }` on success; returns 404 if the slot doesn't exist for that build

No schema changes required — `BuildSlot` rows are independently deletable. No cache revalidation needed: the existing `PUT /api/builds/[id]/slots` handler does not call `revalidateDashboardData()`, so DELETE follows the same pattern.

### Step 2 Failure Handling

If Step 1 succeeds but Step 2 fails (assign to new build returns an error), the old build's slot is already cleared. The user sees the error message in the banner. At this point `conflict` is reset (the accessory is no longer assigned anywhere), so the user can simply click the accessory again and assign normally. No manual cleanup required.

## Files Changed

| File | Change |
|---|---|
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Add `conflict`, `transferMode`, `transferring` state; expand error banner into transfer card; add `transferAccessory()` function |
| `src/app/api/builds/[id]/slots/route.ts` | Add `DELETE` handler accepting `?slotType=` |

## Out of Scope

- Transferring accessories between firearms (different firearm builds)
- Batch transfer of multiple accessories at once
- Transfer history / audit log
