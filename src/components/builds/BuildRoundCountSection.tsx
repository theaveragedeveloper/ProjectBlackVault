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
      setLoading(true);
      await fetchRoundCount();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add rounds");
    } finally {
      setSubmitting(false);
    }
  }

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
      <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint mb-3">
        Round Count
      </p>

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
                      key={entry.type === "manual" ? entry.id : entry.sessionId}
                      className="flex items-start justify-between gap-2 py-2 border-b border-vault-border/50 last:border-0"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Target className="w-3 h-3 text-vault-text-faint shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs text-vault-text">
                            +{entry.roundsAdded.toLocaleString()} rds
                          </p>
                          {entry.type === "manual" && entry.sessionNote && (
                            <p className="text-[11px] text-vault-text-muted truncate">
                              {entry.sessionNote}
                            </p>
                          )}
                          {entry.type === "session" && (
                            <p className="text-[11px] text-vault-text-muted truncate">
                              {entry.location}
                            </p>
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
