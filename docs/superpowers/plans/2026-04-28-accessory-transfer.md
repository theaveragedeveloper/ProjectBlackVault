# Accessory Transfer Between Builds — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a user to transfer an accessory from a conflicting build directly inside the slot assignment modal, without navigating away.

**Architecture:** Two changes — a new `DELETE` handler on the existing slots route to remove a `BuildSlot` row, and expanded state + UI in `AccessoryBrowserModal` that converts the 409 error banner into an inline transfer card.

**Tech Stack:** Next.js 15 App Router, Prisma (SQLite), React `useState`, Tailwind, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-28-accessory-transfer-design.md`

---

## File Map

| File | Change |
|---|---|
| `src/app/api/builds/[id]/slots/route.ts` | Add `DELETE` handler |
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Add conflict state, `transferAccessory()`, transfer card UI |

---

## Task 1: Add DELETE /api/builds/[id]/slots

**File:** `src/app/api/builds/[id]/slots/route.ts`

This route already has a `PUT` handler (lines 8–104). Append a `DELETE` export to the same file.

The handler must:
1. Read `buildId` from route params
2. Read `slotType` from `?slotType=` query param — return 400 if missing/empty
3. Verify the build exists — return 404 if not
4. Find the `BuildSlot` where `{ buildId, slotType }` — return 404 if not found
5. Delete it with `prisma.buildSlot.delete`
6. Return `{ success: true, slotType }`

- [ ] **Step 1: Add the DELETE handler**

Append this to the bottom of `src/app/api/builds/[id]/slots/route.ts`:

```ts
// DELETE /api/builds/[id]/slots?slotType=OPTIC - Remove a slot entirely from a build
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: buildId } = await params;
    const { searchParams } = new URL(request.url);
    const slotType = searchParams.get("slotType");

    if (!slotType) {
      return NextResponse.json(
        { error: "Missing required query param: slotType" },
        { status: 400 }
      );
    }

    const build = await prisma.build.findUnique({ where: { id: buildId } });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const slot = await prisma.buildSlot.findUnique({
      where: { buildId_slotType: { buildId, slotType } },
    });
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    await prisma.buildSlot.delete({
      where: { buildId_slotType: { buildId, slotType } },
    });

    return NextResponse.json({ success: true, slotType });
  } catch (error) {
    console.error("DELETE /api/builds/[id]/slots error:", error);
    return NextResponse.json(
      { error: "Failed to delete slot" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify the dev server compiles with no errors**

```bash
npm run dev
```

Expected: No TypeScript or compilation errors in the terminal.

- [ ] **Step 3: Smoke-test the DELETE route manually**

With the dev server running, open a build and note its ID from the URL (`/vault/[id]/builds/[buildId]`). Check the DB for a known `slotType` on that build via Prisma Studio (`npx prisma studio`), then run:

```bash
curl -X DELETE "http://localhost:3000/api/builds/<buildId>/slots?slotType=OPTIC"
```

Expected: `{"success":true,"slotType":"OPTIC"}` (or 404 if no OPTIC slot exists — that's also correct behavior).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/builds/\[id\]/slots/route.ts
git commit -m "feat: add DELETE /api/builds/[id]/slots to remove a slot row"
```

---

## Task 2: Add conflict state to AccessoryBrowserModal

**File:** `src/app/vault/[id]/builds/[buildId]/page.tsx`

The `AccessoryBrowserModal` function starts at line 84. The existing state block ends around line 115.

- [ ] **Step 1: Add the three new state variables**

After line 95 (`const [assignError, setAssignError] = useState<string | null>(null);`), insert:

```ts
const [conflict, setConflict] = useState<{
  buildId: string
  buildName: string
  slotType: string
} | null>(null)
const [transferMode, setTransferMode] = useState<"leave-empty" | "remove-slot">("leave-empty")
const [transferring, setTransferring] = useState(false)
```

- [ ] **Step 2: Update assignAccessory() to capture the conflict payload**

The current `assignAccessory` function (lines 143–164) sets only `assignError` on failure. Replace the failure branch to also capture `conflictingSlot`:

Find this block:
```ts
      const json = await res.json();
      if (!res.ok) {
        setAssignError(json.error ?? "Failed to assign accessory");
      } else {
        onAssigned();
        onClose();
      }
```

Replace with:
```ts
      const json = await res.json();
      if (!res.ok) {
        setAssignError(json.error ?? "Failed to assign accessory");
        if (res.status === 409 && json.conflictingSlot) {
          setConflict(json.conflictingSlot);
          setTransferMode("leave-empty");
        } else {
          setConflict(null);
        }
      } else {
        onAssigned();
        onClose();
      }
```

Also reset conflict on a new assignment attempt — add `setConflict(null)` at the top of `assignAccessory`, alongside the existing `setAssignError(null)`:
```ts
  async function assignAccessory(accessoryId: string) {
    setAssigning(accessoryId);
    setAssignError(null);
    setConflict(null);   // ← add this line
    try {
```

- [ ] **Step 3: Commit checkpoint**

```bash
git add src/app/vault/\[id\]/builds/\[buildId\]/page.tsx
git commit -m "feat: capture conflict state in AccessoryBrowserModal on 409"
```

---

## Task 3: Add transferAccessory() function

**File:** `src/app/vault/[id]/builds/[buildId]/page.tsx`

Add this function inside `AccessoryBrowserModal`, after `assignAccessory` and before `handleCreate`. It needs access to the `conflict`, `transferMode`, `transferring` state, plus the prop `buildId`, the pending `slotType` prop, and the `accessoryId` being transferred (passed as argument).

- [ ] **Step 1: Add the transferAccessory function**

Insert after the closing brace of `assignAccessory` (around line 164):

```ts
  async function transferAccessory(accessoryId: string) {
    if (!conflict) return;
    setTransferring(true);
    setAssignError(null);
    try {
      // Step 1: Release from old build
      let releaseRes: Response;
      if (transferMode === "remove-slot") {
        releaseRes = await fetch(
          `/api/builds/${conflict.buildId}/slots?slotType=${encodeURIComponent(conflict.slotType)}`,
          { method: "DELETE" }
        );
      } else {
        releaseRes = await fetch(`/api/builds/${conflict.buildId}/slots`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slotType: conflict.slotType, accessoryId: null }),
        });
      }

      if (!releaseRes.ok) {
        const j = await releaseRes.json();
        setAssignError(j.error ?? "Failed to release accessory from previous build");
        return;
      }

      // Step 2: Assign to current build
      const assignRes = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId }),
      });

      if (!assignRes.ok) {
        const j = await assignRes.json();
        setAssignError(j.error ?? "Failed to assign accessory to this build");
        setConflict(null); // accessory is now unassigned — user can retry normally
        return;
      }

      // Success: reset conflict, stay open for continued editing
      setConflict(null);
      setAssignError(null);
      setTransferMode("leave-empty");
      onAssigned();
      // intentionally do NOT call onClose() — modal stays open
    } catch {
      setAssignError("Network error during transfer");
    } finally {
      setTransferring(false);
    }
  }
```

Note: `transferAccessory` receives the `accessoryId` as a parameter because the `conflict` state is set at the time of the failed assign — we need to know which accessory the user clicked. We'll pass it from the transfer card UI in Task 4.

- [ ] **Step 2: Verify compilation**

```bash
npm run dev
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/vault/\[id\]/builds/\[buildId\]/page.tsx
git commit -m "feat: add transferAccessory() to AccessoryBrowserModal"
```

---

## Task 4: Replace the error banner with the transfer card UI

**File:** `src/app/vault/[id]/builds/[buildId]/page.tsx`

The current error banner is at lines 302–308:

```tsx
        {/* Error banner (browse view assign errors) */}
        {view === "browse" && assignError && (
          <div className="mx-5 mt-3 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{assignError}</p>
          </div>
        )}
```

We also need to track which `accessoryId` the conflict is associated with so the transfer card can call `transferAccessory(pendingAccessoryId)`. Add one more state variable in Task 2's Step 1 block:

```ts
const [pendingAccessoryId, setPendingAccessoryId] = useState<string | null>(null)
```

And in `assignAccessory`, set it when a 409 fires:

```ts
        if (res.status === 409 && json.conflictingSlot) {
          setConflict(json.conflictingSlot);
          setTransferMode("leave-empty");
          setPendingAccessoryId(accessoryId);   // ← add this
        }
```

And reset it on a new attempt:
```ts
    setAssignError(null);
    setConflict(null);
    setPendingAccessoryId(null);   // ← add this
```

Now replace the error banner block with the conditional transfer card:

- [ ] **Step 1: Add `pendingAccessoryId` state and set it in assignAccessory**

(Follow the diffs described above — add state variable, set on 409, reset at top of function.)

- [ ] **Step 2: Replace the error banner JSX**

Replace the entire error banner block (lines 302–308) with:

```tsx
        {/* Error banner / Transfer card */}
        {view === "browse" && assignError && (
          <div className="mx-5 mt-3 shrink-0">
            {conflict && pendingAccessoryId ? (
              /* Transfer card */
              <div className="bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-3 space-y-3">
                {/* Conflict header */}
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#E53935]">
                    Already in <span className="font-semibold">&quot;{conflict.buildName}&quot;</span>
                    {" "}/ {getSlotLabel(conflict.slotType)}
                  </p>
                </div>

                {/* Radio options */}
                <div className="space-y-1.5 pl-6">
                  <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-2">What should happen to that slot?</p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="transferMode"
                      value="leave-empty"
                      checked={transferMode === "leave-empty"}
                      onChange={() => setTransferMode("leave-empty")}
                      className="accent-[#00C2FF]"
                    />
                    <span className="text-xs text-vault-text-muted group-hover:text-vault-text transition-colors">
                      Leave slot empty on &quot;{conflict.buildName}&quot;
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="transferMode"
                      value="remove-slot"
                      checked={transferMode === "remove-slot"}
                      onChange={() => setTransferMode("remove-slot")}
                      className="accent-[#00C2FF]"
                    />
                    <span className="text-xs text-vault-text-muted group-hover:text-vault-text transition-colors">
                      Remove slot from &quot;{conflict.buildName}&quot;
                    </span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => { setConflict(null); setAssignError(null); setPendingAccessoryId(null); setTransferMode("leave-empty"); }}
                    disabled={transferring}
                    className="text-xs text-vault-text-muted hover:text-vault-text transition-colors px-3 py-1.5 rounded-md hover:bg-vault-border disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => transferAccessory(pendingAccessoryId)}
                    disabled={transferring}
                    className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors px-3 py-1.5 rounded-md disabled:opacity-50"
                  >
                    {transferring && <Loader2 className="w-3 h-3 animate-spin" />}
                    Transfer →
                  </button>
                </div>
              </div>
            ) : (
              /* Plain error banner (non-conflict errors) */
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{assignError}</p>
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 3: Verify the dev server compiles with no TypeScript errors**

```bash
npm run dev
```

- [ ] **Step 4: Manual end-to-end test**

1. Open a firearm build that has an accessory already assigned (e.g., an OPTIC slot filled).
2. Open a second build on the same or different firearm.
3. In the second build, click an empty OPTIC slot → accessory browser opens.
4. Click the same optic that's already assigned to the first build.
5. **Expected:** The error banner expands into the transfer card showing the conflict build name and two radio options.
6. Select "Leave slot empty" → click Transfer → optic moves to the new build; old slot stays (empty). Modal stays open.
7. Repeat, this time select "Remove slot from [Build Name]" → click Transfer → optic moves; old slot row is deleted. Modal stays open.
8. Click a different accessory row → conflict/error state clears immediately.
9. Test Cancel → state resets, no API calls.

- [ ] **Step 5: Commit**

```bash
git add src/app/vault/\[id\]/builds/\[buildId\]/page.tsx
git commit -m "feat: inline transfer card in AccessoryBrowserModal on 409 conflict"
```
