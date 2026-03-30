# V1.0.2 UX Fixes — Ammo, Accessories & Alerts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix five UX issues across the ammo and accessories sections: battery alert deep links, ammo edit button, accessory image upload in build configurator, Add Rounds purchase details, and duplicate ammo merge prompt.

**Architecture:** All changes are scoped to existing files. One Prisma schema migration adds three optional fields to `AmmoTransaction`. All UI changes follow the existing modal pattern in `src/app/ammo/page.tsx`. No new routes or components files are created.

**Tech Stack:** Next.js 15 App Router, Prisma + SQLite, Tailwind CSS, lucide-react icons, `VaultInput`/`VaultButton` UI primitives from `@/components/shared/ui-primitives`.

---

## Task 1 — Schema Migration: Add purchase fields to AmmoTransaction

**Files:**
- Modify: `prisma/schema.prisma` (AmmoTransaction model, lines 249-263)

The `AmmoTransaction` model currently has no price or date fields. We need three optional fields so the Add Rounds modal can persist purchase details.

- [ ] **Step 1: Add three optional fields to AmmoTransaction in schema.prisma**

Find the `AmmoTransaction` model (ends with `@@index([transactedAt])`). Add the three lines before the closing `}`:

```prisma
model AmmoTransaction {
  id           String    @id @default(cuid())
  stockId      String
  stock        AmmoStock @relation(fields: [stockId], references: [id], onDelete: Cascade)
  type         String
  quantity     Int
  previousQty  Int
  newQty       Int
  note         String?
  transactedAt DateTime  @default(now())
  purchasePrice  Float?
  pricePerRound  Float?
  purchaseDate   DateTime?

  @@index([stockId])
  @@index([transactedAt])
}
```

- [ ] **Step 2: Generate and apply the migration**

```bash
cd /path/to/ProjectBlackVault
npx prisma migrate dev --name add-transaction-purchase-fields
```

Expected output: `✔  Generated Prisma Client` and a new migration file under `prisma/migrations/`.

- [ ] **Step 3: Verify Prisma client regenerated**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add purchasePrice/pricePerRound/purchaseDate to AmmoTransaction schema"
```

---

## Task 2 — API: Accept purchase fields in POST /api/ammo/[id]/transactions

**Files:**
- Modify: `src/app/api/ammo/[id]/transactions/route.ts`

The POST handler currently destructures `{ type, quantity, note }` from the body and ignores anything else. We need to extract and persist the three new optional fields.

- [ ] **Step 1: Update the POST handler to accept and store the new fields**

Find the destructure line (currently reads `const { type, quantity, note } = body;`) and replace it:

```typescript
const { type, quantity, note, purchasePrice, pricePerRound, purchaseDate } = body;
```

Then find the `prisma.ammoTransaction.create` call inside the `$transaction` block and add the three fields to its `data` object:

```typescript
prisma.ammoTransaction.create({
  data: {
    stockId: id,
    type,
    quantity,
    previousQty,
    newQty,
    note: note ?? null,
    purchasePrice: purchasePrice ?? null,
    pricePerRound: pricePerRound ?? null,
    purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
  },
}),
```

- [ ] **Step 2: Start the dev server and verify the API still works**

```bash
npm run dev
```

Open `http://localhost:3000/ammo`, click **Add Rounds** on any stock, add 10 rounds — should succeed as before (the new fields are optional and not yet in the UI).

- [ ] **Step 3: Commit**

```bash
git add 'src/app/api/ammo/[id]/transactions/route.ts'
git commit -m "feat: POST /api/ammo/[id]/transactions accepts purchasePrice, pricePerRound, purchaseDate"
```

---

## Task 3 — Battery Alert Deep Link

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx` (lines ~274 and ~298)

Both the "overdue" and "due soon" battery alert `<Link>` elements hardcode `href="/accessories"`. The `BatteryDueItem` interface already has `id: string`.

- [ ] **Step 1: Fix the overdue battery alert link (line ~276)**

Find:
```tsx
href={`/accessories`}
```
in the **overdue** battery items map (the one with `{daysOverdue}d overdue`). Replace with:
```tsx
href={`/accessories/${item.id}`}
```

- [ ] **Step 2: Fix the due-soon battery alert link (line ~300)**

Find the second `href={`/accessories`}` in the **due soon** map. Replace with:
```tsx
href={`/accessories/${item.id}`}
```

- [ ] **Step 3: Verify**

Open `http://localhost:3000` (Command Center). If you have any accessories with battery tracking set up, the alert items should now navigate to `/accessories/[id]` when clicked. If no battery alerts are visible, you can temporarily set a `lastBatteryChangeDate` far in the past on any accessory via Prisma Studio (`npx prisma studio`).

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/DashboardClient.tsx
git commit -m "fix: battery change alerts now deep-link to /accessories/[id]"
```

---

## Task 4 — Accessory Image Upload in Build Configurator

**Files:**
- Modify: `src/app/vault/[id]/builds/[buildId]/page.tsx` (lines ~508-517)

The build configurator's accessory edit form has a plain URL text input for the image field. Replace it with the `ImagePicker` component already used by the accessory edit page.

- [ ] **Step 1: Import ImagePicker**

At the top of `src/app/vault/[id]/builds/[buildId]/page.tsx`, add after the existing imports:

```typescript
import ImagePicker from "@/components/shared/ImagePicker";
```

- [ ] **Step 2: Replace the URL text input with ImagePicker**

Find this block (lines ~508-517):
```tsx
{/* Image URL */}
<div>
  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Image URL</label>
  <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))}
    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
    placeholder="https://..." />
</div>
```

Replace with:
```tsx
{/* Image */}
<div>
  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Image</label>
  <ImagePicker
    entityType="accessory"
    value={form.imageUrl || null}
    onChange={(url) => setForm(f => ({ ...f, imageUrl: url ?? "" }))}
  />
</div>
```

Note: The create form has no accessory ID yet, so `entityId` is omitted — `ImagePicker` will use its internal temp UUID for the upload path. `onChange` receives `string | null`; the `?? ""` coerces `null` back to an empty string to match the `form.imageUrl: string` type.

- [ ] **Step 3: Verify**

Open any firearm's build configurator (`/vault/[id]/builds/[buildId]`), click on an accessory slot to edit it — the image field should now show a drag-and-drop upload area instead of a text input. Upload a photo and save; the accessory detail page should show the new image.

- [ ] **Step 4: Commit**

```bash
git add 'src/app/vault/[id]/builds/[buildId]/page.tsx'
git commit -m "fix: replace image URL text input with ImagePicker in build configurator"
```

---

## Task 5 — Add Rounds Modal: Purchase Details

**Files:**
- Modify: `src/app/ammo/page.tsx` (`AddRoundsModal` component, lines 61-158)

Add three optional fields — Total Cost, Price Per Round (auto-calculated), and Purchase Date — to the `AddRoundsModal`. Mirror the two-way auto-calc logic from `/ammo/new/page.tsx`.

- [ ] **Step 1: Add state variables to AddRoundsModal**

Inside `AddRoundsModal`, after the existing `const [error, setError] = useState<string | null>(null);` line, add:

```typescript
const [totalCost, setTotalCost] = useState("");
const [pricePerRound, setPricePerRound] = useState("");
const [purchaseDate, setPurchaseDate] = useState("");
```

- [ ] **Step 2: Pass the new fields in the fetch body**

Find the `JSON.stringify(...)` call inside `handleSubmit` and replace it:

```typescript
body: JSON.stringify({
  type: "PURCHASE",
  quantity: parsedQty,
  note: note || undefined,
  purchasePrice: totalCost ? Number(totalCost) : undefined,
  pricePerRound: pricePerRound ? Number(pricePerRound) : undefined,
  purchaseDate: purchaseDate || undefined,
}),
```

- [ ] **Step 3: Add the three fields to the form JSX**

After the Note `<div>` block (the one with `placeholder="e.g. Academy purchase"`), insert:

```tsx
{/* Purchase Details */}
<div className="grid grid-cols-2 gap-3">
  <div>
    <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Total Cost ($)</label>
    <VaultInput
      type="number"
      min={0}
      step="0.01"
      value={totalCost}
      onChange={(e) => {
        const val = e.target.value;
        setTotalCost(val);
        const qtyNum = parsedQtyForCalc();
        if (qtyNum > 0 && val) setPricePerRound((Number(val) / qtyNum).toFixed(4));
      }}
      placeholder="e.g. 24.99"
      className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
    />
  </div>
  <div>
    <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Price / Round ($)</label>
    <VaultInput
      type="number"
      min={0}
      step="0.0001"
      value={pricePerRound}
      onChange={(e) => {
        const val = e.target.value;
        setPricePerRound(val);
        const qtyNum = parsedQtyForCalc();
        if (qtyNum > 0 && val) setTotalCost((Number(val) * qtyNum).toFixed(2));
      }}
      placeholder="e.g. 0.0499"
      className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
    />
  </div>
</div>
<div>
  <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Purchase Date</label>
  <VaultInput
    type="date"
    value={purchaseDate}
    onChange={(e) => setPurchaseDate(e.target.value)}
    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
  />
</div>
```

- [ ] **Step 4: Add the parsedQtyForCalc helper inside AddRoundsModal**

The auto-calc needs to read `qty` (the quantity state). Add this helper right above `handleSubmit` inside `AddRoundsModal`:

```typescript
function parsedQtyForCalc(): number {
  const n = Number.parseInt(qty, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
```

- [ ] **Step 5: Verify**

Open `/ammo`, click **Add Rounds** on any stock. The modal should now show Total Cost, Price Per Round, and Purchase Date fields below the Note field. Enter a quantity and total cost — price per round should auto-calculate. Submit and confirm it still works.

- [ ] **Step 6: Commit**

```bash
git add src/app/ammo/page.tsx
git commit -m "feat: Add Rounds modal now captures purchase price and date"
```

---

## Task 6 — Ammo Edit Modal

**Files:**
- Modify: `src/app/ammo/page.tsx`

Add an `EditAmmoModal` component and an Edit button on each stock row. The modal pre-populates from the stock object and calls `PUT /api/ammo/[id]`. On success, replace the stock in local groups state.

- [ ] **Step 1: Add Pencil to lucide imports**

Find the lucide import block at the top of `src/app/ammo/page.tsx`:
```typescript
import {
  Target,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingDown,
} from "lucide-react";
```

Add `Pencil` to the list.

- [ ] **Step 2: Add editModal state**

In the `AmmoPage` component, find the existing modal state declarations:
```typescript
const [addModal, setAddModal] = useState<AmmoStock | null>(null);
const [logModal, setLogModal] = useState<AmmoStock | null>(null);
```

Add:
```typescript
const [editModal, setEditModal] = useState<AmmoStock | null>(null);
```

- [ ] **Step 3: Add handleStockEdit updater function**

After the `handleQtyUpdate` function, add:

```typescript
function handleStockEdit(updated: AmmoStock) {
  setGroups((prev) =>
    prev.map((g) => {
      const hasStock = g.stocks.some((s) => s.id === updated.id);
      if (!hasStock) return g;
      const newStocks = g.stocks.map((s) => (s.id === updated.id ? updated : s));
      return {
        ...g,
        caliber: updated.caliber, // caliber may have changed
        stocks: newStocks,
        totalQuantity: newStocks.reduce((sum, s) => sum + s.quantity, 0),
      };
    })
  );
}
```

- [ ] **Step 4: Add the Edit button to each stock row**

Find the action buttons block (lines ~488-510):
```tsx
<div className="flex items-center gap-2 ml-3.5">
  <button
    onClick={() => setAddModal(stock)}
    ...
```

Add the Edit button as the first button in the row, before the Add Rounds button:

```tsx
<button
  onClick={() => setEditModal(stock)}
  className="flex items-center gap-1 text-[10px] bg-vault-surface border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/40 px-2 py-1 rounded transition-colors"
>
  <Pencil className="w-2.5 h-2.5" />
  Edit
</button>
```

- [ ] **Step 5: Render EditAmmoModal in the modals section**

Find the existing modal renders near the bottom of the page component (where `{addModal && <AddRoundsModal ...`). Add:

```tsx
{editModal && (
  <EditAmmoModal
    stock={editModal}
    onClose={() => setEditModal(null)}
    onSuccess={(updated) => {
      handleStockEdit(updated);
      setEditModal(null);
    }}
  />
)}
```

- [ ] **Step 6: Write the EditAmmoModal component**

Add this component after the `AddRoundsModal` component (before the `LogRangeUseModal`):

```typescript
function EditAmmoModal({
  stock,
  onClose,
  onSuccess,
}: {
  stock: AmmoStock;
  onClose: () => void;
  onSuccess: (updated: AmmoStock) => void;
}) {
  const [caliber, setCaliber] = useState(stock.caliber);
  const [brand, setBrand] = useState(stock.brand);
  const [grainWeight, setGrainWeight] = useState(stock.grainWeight?.toString() ?? "");
  const [bulletType, setBulletType] = useState(stock.bulletType ?? "");
  const [storageLocation, setStorageLocation] = useState(stock.storageLocation ?? "");
  const [lowStockAlert, setLowStockAlert] = useState(stock.lowStockAlert?.toString() ?? "");
  const [notes, setNotes] = useState(stock.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caliber.trim() || !brand.trim()) {
      setError("Caliber and brand are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/ammo/${stock.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caliber: caliber.trim(),
        brand: brand.trim(),
        grainWeight: grainWeight ? Number(grainWeight) : null,
        bulletType: bulletType.trim() || null,
        storageLocation: storageLocation.trim() || null,
        lowStockAlert: lowStockAlert ? Number(lowStockAlert) : null,
        notes: notes.trim() || null,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to update");
      setSubmitting(false);
    } else {
      onSuccess(json as AmmoStock);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-bg/80 backdrop-blur-sm">
      <div className="bg-vault-surface border border-vault-border rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold text-vault-text mb-4">Edit Ammo</h3>
        {error && (
          <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">
                Caliber <span className="text-[#E53935]">*</span>
              </label>
              <VaultInput
                type="text"
                required
                value={caliber}
                onChange={(e) => setCaliber(e.target.value)}
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">
                Brand <span className="text-[#E53935]">*</span>
              </label>
              <VaultInput
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Grain Weight</label>
              <VaultInput
                type="number"
                min={0}
                step="0.1"
                value={grainWeight}
                onChange={(e) => setGrainWeight(e.target.value)}
                placeholder="e.g. 124"
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Bullet Type</label>
              <VaultInput
                type="text"
                value={bulletType}
                onChange={(e) => setBulletType(e.target.value)}
                placeholder="e.g. FMJ"
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Storage Location</label>
            <VaultInput
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              placeholder="e.g. Safe A"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Low Stock Alert (rds)</label>
            <VaultInput
              type="number"
              min={0}
              value={lowStockAlert}
              onChange={(e) => setLowStockAlert(e.target.value)}
              placeholder="e.g. 200"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <VaultButton type="button" onClick={onClose} variant="ghost">Cancel</VaultButton>
            <VaultButton type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
              Save
            </VaultButton>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Verify**

Open `/ammo`. Each stock row should have an **Edit** button. Click it — modal opens pre-populated. Edit the brand name, save — the row updates in-place without a page reload.

- [ ] **Step 8: Commit**

```bash
git add src/app/ammo/page.tsx
git commit -m "feat: add Edit button and EditAmmoModal to ammo stock rows"
```

---

## Task 7 — Duplicate Ammo Merge Prompt

**Files:**
- Modify: `src/app/ammo/new/page.tsx`

On form submit, fetch all existing ammo stocks and check for a match (caliber + brand + grainWeight + bulletType). If found, show an inline prompt before proceeding.

- [ ] **Step 1: Add duplicate detection state**

In `src/app/ammo/new/page.tsx`, find the existing `useState` declarations at the top of the component and add:

```typescript
const [duplicateMatch, setDuplicateMatch] = useState<{
  id: string;
  brand: string;
  caliber: string;
  grainWeight: number | null;
  bulletType: string | null;
  quantity: number;
} | null>(null);
const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null);
```

- [ ] **Step 2: Extract a matchesDuplicate helper**

Add this pure function above the component (or inside it before `handleSubmit`):

```typescript
function matchesDuplicate(
  existing: { caliber: string; brand: string; grainWeight: number | null; bulletType: string | null },
  payload: { caliber: string; brand: string; grainWeight: number | null; bulletType: string | null }
): boolean {
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
  const sameNullable = (a: number | string | null, b: number | string | null) =>
    a === null && b === null ? true : a !== null && b !== null && String(a) === String(b);
  return (
    same(existing.caliber, payload.caliber) &&
    same(existing.brand, payload.brand) &&
    sameNullable(existing.grainWeight, payload.grainWeight) &&
    sameNullable(existing.bulletType, payload.bulletType)
  );
}
```

- [ ] **Step 3: Update handleSubmit to check for duplicates before creating**

Replace the section in `handleSubmit` after `setFormErrors({})` and before the `fetch("/api/ammo", ...)` call:

```typescript
// Check for duplicates before creating
try {
  const existing = await fetch("/api/ammo").then((r) => r.json());
  // GET /api/ammo returns { grouped: [...], all: [...] }
  // `all` is a flat array of every AmmoStock — use it directly
  const allStocks: Array<{ id: string; caliber: string; brand: string; grainWeight: number | null; bulletType: string | null; quantity: number }> =
    existing?.all ?? [];
  const match = allStocks.find((s) => matchesDuplicate(s, payload));
  if (match) {
    setPendingPayload(payload);
    setDuplicateMatch(match);
    setLoading(false);
    return; // Stop here — wait for user decision
  }
} catch {
  // If check fails, proceed with normal create
}

// No duplicate — create as normal
const res = await fetch("/api/ammo", { ... }); // existing code unchanged
```

- [ ] **Step 4: Add "Yes, merge" handler**

Add this function inside the component:

```typescript
async function handleMergeConfirm() {
  if (!duplicateMatch || !pendingPayload) return;
  setLoading(true);
  setError(null);
  const res = await fetch(`/api/ammo/${duplicateMatch.id}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "PURCHASE",
      quantity: Number(pendingPayload.quantity),
      purchasePrice: pendingPayload.purchasePrice ?? undefined,
      pricePerRound: pendingPayload.pricePerRound ?? undefined,
      purchaseDate: pendingPayload.purchaseDate ?? undefined,
      note: pendingPayload.notes ? String(pendingPayload.notes) : undefined,
    }),
  });
  if (res.ok) {
    router.push("/ammo");
  } else {
    const json = await res.json();
    setError(json.error ?? "Failed to add rounds to existing stock.");
    setLoading(false);
    setDuplicateMatch(null);
    setPendingPayload(null);
  }
}
```

- [ ] **Step 5: Render the duplicate prompt in the JSX**

Find the submit button at the bottom of the form. Just above it, insert the prompt (it only renders when `duplicateMatch` is set):

```tsx
{duplicateMatch && (
  <div className="bg-[#F5A623]/10 border border-[#F5A623]/40 rounded-lg p-4 space-y-3">
    <p className="text-sm text-vault-text">
      You already have{" "}
      <span className="font-semibold">
        {duplicateMatch.brand} {duplicateMatch.caliber}
        {duplicateMatch.grainWeight ? ` ${duplicateMatch.grainWeight}gr` : ""}
        {duplicateMatch.bulletType ? ` ${duplicateMatch.bulletType}` : ""}
      </span>{" "}
      in stock ({duplicateMatch.quantity.toLocaleString()} rds). Add these rounds to existing stock instead?
    </p>
    <div className="flex gap-2">
      <VaultButton
        type="button"
        variant="success"
        onClick={handleMergeConfirm}
        disabled={loading}
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Yes, add to existing
      </VaultButton>
      <VaultButton
        type="button"
        variant="ghost"
        onClick={() => {
          setDuplicateMatch(null);
          setPendingPayload(null);
          // Re-submit as a separate lot
          if (pendingPayload) {
            setLoading(true);
            fetch("/api/ammo", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(pendingPayload),
            })
              .then((r) => r.json())
              .then((json) => {
                if (json.id) router.push("/ammo");
                else setError(json.error ?? "Failed to create ammo stock.");
              })
              .catch(() => setError("Network error."))
              .finally(() => setLoading(false));
          }
        }}
      >
        No, create separate lot
      </VaultButton>
    </div>
  </div>
)}
```

- [ ] **Step 6: Verify**

Go to `/ammo/new`. Add a new entry with the same caliber, brand, grain weight, and bullet type as an existing stock. On submit, the prompt should appear. Click "Yes, add to existing" — you should be redirected to `/ammo` and the stock count should increase. Try again and click "No, create separate lot" — a second lot should appear.

- [ ] **Step 8: Commit**

```bash
git add src/app/ammo/new/page.tsx
git commit -m "feat: duplicate ammo detection with merge-or-separate-lot prompt on new ammo form"
```

---

## Final Step — Push and Update PR

- [ ] **Push branch and verify PR is current**

```bash
git push
```

Check `https://github.com/theaveragedeveloper/BlackVaultArmory/pull/221` — all 7 commits should appear.

- [ ] **Smoke test on mobile width**

Resize browser to 390px and verify:
- Battery alert on dashboard links to correct accessory
- Ammo page shows Edit button on each stock row
- Add Rounds modal has price/date fields
- Build configurator accessory image shows upload widget
- New ammo form shows merge prompt on duplicate
