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
- Validates: build must exist, `slotType` must be provided
- Finds the `BuildSlot` row for `{ buildId, slotType }` and deletes it
- Returns `{ success: true }` on success, 404 if the slot doesn't exist

No schema changes required — `BuildSlot` rows are already independently deletable.

## Files Changed

| File | Change |
|---|---|
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Add `conflict`, `transferMode`, `transferring` state; expand error banner into transfer card; add `transferAccessory()` function |
| `src/app/api/builds/[id]/slots/route.ts` | Add `DELETE` handler accepting `?slotType=` |

## Out of Scope

- Transferring accessories between firearms (different firearm builds)
- Batch transfer of multiple accessories at once
- Transfer history / audit log
