# Build Round Count Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a round count to each build that combines manually-added rounds and rounds from linked range sessions, with a log of all entries visible on the build configurator page.

**Architecture:** Add `roundCount` + `BuildRoundCountLog` to the schema (mirroring the accessory pattern). A new API route handles GET (merged timeline) and POST (add rounds). A new self-contained `BuildRoundCountSection` component handles all UI so the already-large build configurator page gets a single import + one JSX line.

**Tech Stack:** Next.js 15 App Router, Prisma (SQLite), Tailwind, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Add `roundCount` to `Build`, add `BuildRoundCountLog` model |
| `src/app/api/builds/[id]/round-count/route.ts` | Create | GET (fetch totals + merged log) and POST (add rounds) |
| `src/components/builds/BuildRoundCountSection.tsx` | Create | Self-contained UI: display, add-rounds form, collapsible log |
| `src/app/vault/[id]/builds/[buildId]/page.tsx` | Modify | Import + render `<BuildRoundCountSection buildId={buildId} />` |

---

## Task 1: Schema — Add `roundCount` to Build and create `BuildRoundCountLog`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Edit schema**

In `prisma/schema.prisma`, add `roundCount` and the relation to the `Build` model (after the `rangeSessions` line):

```prisma
  roundCount     Int                  @default(0)
  roundCountLogs BuildRoundCountLog[]
```

Then add the new model after the `RangeSession` block:

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

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_build_round_count
```

Expected: migration file created in `prisma/migrations/`, Prisma client regenerated.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add BuildRoundCountLog schema and roundCount to Build"
```

---

## Task 2: API Route — GET and POST `/api/builds/[id]/round-count`

**Files:**
- Create: `src/app/api/builds/[id]/round-count/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/builds/[id]/round-count
// Returns manualRoundCount, sessionRoundCount, totalRoundCount, and a merged log
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const build = await prisma.build.findUnique({
      where: { id },
      select: { roundCount: true },
    });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    // Sum rounds from all linked range sessions
    const sessionAggregate = await prisma.rangeSession.aggregate({
      where: { buildId: id },
      _sum: { roundsFired: true },
    });
    const sessionRoundCount = sessionAggregate._sum.roundsFired ?? 0;

    // Manual log entries
    const manualLogs = await prisma.buildRoundCountLog.findMany({
      where: { buildId: id },
      orderBy: { loggedAt: "desc" },
    });

    // Session entries for the timeline
    const sessions = await prisma.rangeSession.findMany({
      where: { buildId: id },
      select: {
        id: true,
        location: true,
        roundsFired: true,
        sessionDate: true,
      },
      orderBy: { sessionDate: "desc" },
    });

    // Merge and sort descending by date
    type LogEntry =
      | {
          type: "manual";
          id: string;
          roundsAdded: number;
          previousCount: number;
          newCount: number;
          sessionNote: string | null;
          loggedAt: string;
          date: string;
        }
      | {
          type: "session";
          id: string;
          sessionId: string;
          location: string;
          roundsAdded: number;
          sessionDate: string;
          date: string;
        };

    const merged: LogEntry[] = [
      ...manualLogs.map((l) => ({
        type: "manual" as const,
        id: l.id,
        roundsAdded: l.roundsAdded,
        previousCount: l.previousCount,
        newCount: l.newCount,
        sessionNote: l.sessionNote,
        loggedAt: l.loggedAt.toISOString(),
        date: l.loggedAt.toISOString(),
      })),
      ...sessions.map((s) => ({
        type: "session" as const,
        id: s.id,
        sessionId: s.id,
        location: s.location,
        roundsAdded: s.roundsFired,
        sessionDate: s.sessionDate.toISOString(),
        date: s.sessionDate.toISOString(),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      manualRoundCount: build.roundCount,
      sessionRoundCount,
      totalRoundCount: build.roundCount + sessionRoundCount,
      logs: merged,
    });
  } catch (error) {
    console.error("GET /api/builds/[id]/round-count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch round count" },
      { status: 500 }
    );
  }
}

// POST /api/builds/[id]/round-count
// Body: { roundsAdded: number, sessionNote?: string }
// Atomically updates Build.roundCount and creates a BuildRoundCountLog entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { roundsAdded, sessionNote } = body;

    if (
      roundsAdded === undefined ||
      roundsAdded === null ||
      typeof roundsAdded !== "number" ||
      !Number.isInteger(roundsAdded) ||
      roundsAdded <= 0
    ) {
      return NextResponse.json(
        { error: "roundsAdded must be a positive integer" },
        { status: 400 }
      );
    }

    const build = await prisma.build.findUnique({
      where: { id },
      select: { roundCount: true },
    });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const previousCount = build.roundCount;
    const newCount = previousCount + roundsAdded;

    await prisma.$transaction([
      prisma.build.update({
        where: { id },
        data: { roundCount: newCount },
      }),
      prisma.buildRoundCountLog.create({
        data: {
          buildId: id,
          roundsAdded,
          previousCount,
          newCount,
          sessionNote: sessionNote ?? null,
        },
      }),
    ]);

    // Recompute session total for response
    const sessionAggregate = await prisma.rangeSession.aggregate({
      where: { buildId: id },
      _sum: { roundsFired: true },
    });
    const sessionRoundCount = sessionAggregate._sum.roundsFired ?? 0;

    return NextResponse.json(
      {
        manualRoundCount: newCount,
        sessionRoundCount,
        totalRoundCount: newCount + sessionRoundCount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/builds/[id]/round-count error:", error);
    return NextResponse.json(
      { error: "Failed to add round count" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify the route builds without TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/builds/[id]/round-count/route.ts
git commit -m "feat: add GET and POST /api/builds/[id]/round-count"
```

---

## Task 3: UI Component — `BuildRoundCountSection`

**Files:**
- Create: `src/components/builds/BuildRoundCountSection.tsx`

- [ ] **Step 1: Create the `src/components/builds/` directory**

```bash
mkdir -p src/components/builds
```

- [ ] **Step 2: Create the component**

```typescript
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Target } from "lucide-react";

type ManualLogEntry = {
  type: "manual";
  id: string;
  roundsAdded: number;
  previousCount: number;
  newCount: number;
  sessionNote: string | null;
  loggedAt: string;
  date: string;
};

type SessionLogEntry = {
  type: "session";
  id: string;
  sessionId: string;
  location: string;
  roundsAdded: number;
  sessionDate: string;
  date: string;
};

type LogEntry = ManualLogEntry | SessionLogEntry;

type RoundCountData = {
  manualRoundCount: number;
  sessionRoundCount: number;
  totalRoundCount: number;
  logs: LogEntry[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BuildRoundCountSection({ buildId }: { buildId: string }) {
  const [data, setData] = useState<RoundCountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [logExpanded, setLogExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formRounds, setFormRounds] = useState("");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function fetchRoundCount() {
    setFetchError(false);
    try {
      const res = await fetch(`/api/builds/${buildId}/round-count`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoundCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  async function handleSubmit() {
    const rounds = parseInt(formRounds, 10);
    if (!formRounds || isNaN(rounds) || rounds <= 0) {
      setSubmitError("Enter a positive number of rounds.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/builds/${buildId}/round-count`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundsAdded: rounds,
          sessionNote: formNote.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to add rounds");
      }
      setFormRounds("");
      setFormNote("");
      setShowForm(false);
      // Refresh full data (log needs updating too)
      setLoading(true);
      await fetchRoundCount();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add rounds");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Breakdown line ──────────────────────────────────────────────
  function renderBreakdown() {
    if (!data) return null;
    const { manualRoundCount, sessionRoundCount } = data;
    if (manualRoundCount === 0 && sessionRoundCount === 0) {
      return (
        <p className="text-[11px] text-vault-text-faint mt-0.5">
          No rounds logged yet
        </p>
      );
    }
    const parts: string[] = [];
    if (sessionRoundCount > 0)
      parts.push(`${sessionRoundCount.toLocaleString()} from range sessions`);
    if (manualRoundCount > 0)
      parts.push(`${manualRoundCount.toLocaleString()} manually added`);
    return (
      <p className="text-[11px] text-vault-text-muted mt-0.5">
        {parts.join(" · ")}
      </p>
    );
  }

  return (
    <div className="border-t border-vault-border px-4 py-4">
      {/* Section label */}
      <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint mb-3">
        Round Count
      </p>

      {/* Total display */}
      {loading ? (
        <p className="text-sm text-vault-text-faint">—</p>
      ) : fetchError ? (
        <p className="text-xs text-vault-text-muted">
          Failed to load round count.{" "}
          <button
            onClick={() => { setLoading(true); fetchRoundCount(); }}
            className="text-[#00C2FF] hover:underline"
          >
            Retry
          </button>
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xl font-bold text-vault-text font-mono">
                {data!.totalRoundCount.toLocaleString()}
                <span className="text-sm font-normal text-vault-text-muted ml-1">rds</span>
              </p>
              {renderBreakdown()}
            </div>
            <button
              onClick={() => { setShowForm((v) => !v); setSubmitError(null); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-[#00C2FF]/35 text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Rounds
            </button>
          </div>

          {/* Add Rounds form (inline) */}
          {showForm && (
            <div className="mt-3 p-3 bg-vault-bg border border-vault-border rounded-md flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={formRounds}
                  onChange={(e) => setFormRounds(e.target.value)}
                  placeholder="Rounds fired"
                  className="w-28 bg-vault-surface border border-vault-border rounded-md px-2.5 py-1.5 text-xs text-vault-text focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                />
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Note (optional, e.g. Pre-app backfill)"
                  className="flex-1 bg-vault-surface border border-vault-border rounded-md px-2.5 py-1.5 text-xs text-vault-text focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                />
              </div>
              {submitError && (
                <p className="text-[11px] text-[#E53935]">{submitError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-md text-xs bg-[#00C2FF]/15 border border-[#00C2FF]/35 text-[#00C2FF] hover:bg-[#00C2FF]/25 disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setSubmitError(null); }}
                  className="px-3 py-1.5 rounded-md text-xs border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Round Count Log (collapsible) */}
          {data!.logs.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setLogExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-vault-text-faint hover:text-vault-text transition-colors"
              >
                {logExpanded ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                Round Count Log
              </button>

              {logExpanded && (
                <div className="mt-2 flex flex-col gap-1">
                  {data!.logs.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-2 py-2 border-b border-vault-border/50 last:border-0"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Target className="w-3 h-3 text-vault-text-faint shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          {entry.type === "manual" ? (
                            <>
                              <p className="text-xs text-vault-text">
                                +{entry.roundsAdded.toLocaleString()} rds
                              </p>
                              {entry.sessionNote && (
                                <p className="text-[11px] text-vault-text-muted truncate">
                                  {entry.sessionNote}
                                </p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-xs text-vault-text">
                                +{entry.roundsAdded.toLocaleString()} rds
                              </p>
                              <p className="text-[11px] text-vault-text-muted truncate">
                                {entry.location}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            entry.type === "manual"
                              ? "text-[#F5A623] border-[#F5A623]/40"
                              : "text-[#00C2FF] border-[#00C2FF]/40"
                          }`}
                        >
                          {entry.type === "manual" ? "Manual" : "Session"}
                        </span>
                        <span className="text-[10px] text-vault-text-faint">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Note on session links:** Session log entries show location and date but do not link directly into Range > Session History (the range section has no deep-linkable session URL in V1). This is intentional — out of scope for this feature.

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/builds/BuildRoundCountSection.tsx
git commit -m "feat: add BuildRoundCountSection component"
```

---

## Task 4: Wire component into the build configurator page

**Files:**
- Modify: `src/app/vault/[id]/builds/[buildId]/page.tsx`

The `SlotPanel` component renders the build info area (name, active badge, progress bar, switch build dropdown). The round count section should appear after the panel header, before the slot list.

- [ ] **Step 1: Add import at the top of the file**

Find the existing import block at the top of `src/app/vault/[id]/builds/[buildId]/page.tsx` and add:

```typescript
import { BuildRoundCountSection } from "@/components/builds/BuildRoundCountSection";
```

- [ ] **Step 2: Render the component in `SlotPanel`**

In `SlotPanel`, find the closing `</div>` of the panel header section (the `div` with `px-4 py-4 border-b border-vault-border shrink-0` — it closes after the switch build dropdown block around line 944). Insert `<BuildRoundCountSection buildId={build.id} />` immediately after that closing `</div>` and before the slot list `<div className="md:flex-1 md:overflow-y-auto">`.

The structure should look like:

```tsx
    </div> {/* end panel header */}

    <BuildRoundCountSection buildId={build.id} />

    {/* Slot list — only added slots */}
    <div className="md:flex-1 md:overflow-y-auto">
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Start dev server and test manually**

```bash
npm run dev
```

Navigate to any build at `/vault/[id]/builds/[buildId]`:
- Round count section appears below the panel header
- Shows `—` briefly while loading, then shows `0 rds` / `No rounds logged yet`
- Click `+ Add Rounds`, enter a number and optional note, click `Add`
- Count updates immediately, form closes
- `Round Count Log` chevron appears — click to expand
- Entry shows as `Manual` badge with correct date
- Log any range session on this firearm+build, return to build page — session rounds appear in total and log as `Session` badge

- [ ] **Step 5: Commit**

```bash
git add src/app/vault/[id]/builds/[buildId]/page.tsx
git commit -m "feat: wire BuildRoundCountSection into build configurator page"
```
