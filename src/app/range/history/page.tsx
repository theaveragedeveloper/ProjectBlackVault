"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import { Target, MapPin, Calendar, Loader2, Trash2, ChevronDown, Clock } from "lucide-react";

interface RangeSession {
  id: string;
  firearmId: string;
  buildId: string | null;
  date: string;
  roundsFired: number;
  rangeName: string | null;
  rangeLocation: string | null;
  notes: string | null;
  firearm: { id: string; name: string };
  build: { id: string; name: string } | null;
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RangeHistoryPage() {
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [firearmFilter, setFirearmFilter] = useState<string>("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  const uniqueFirearms = Array.from(
    new Map(sessions.map((s) => [s.firearm.id, s.firearm])).values()
  );

  const filtered = firearmFilter === "ALL"
    ? sessions
    : sessions.filter((s) => s.firearm.id === firearmFilter);

  const totalRounds = filtered.reduce((sum, s) => sum + s.roundsFired, 0);

  useEffect(() => {
    fetch("/api/range-sessions")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/range-sessions/${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* silently fail */ }
    finally { setDeleting(null); }
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="RANGE HISTORY"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} logged`}
        actions={
          <Link href="/range"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors">
            <Target className="w-4 h-4" />
            Log Session
          </Link>
        }
      />

      <div className="p-6">
        {/* Summary */}
        <div className="flex items-center gap-6 mb-6 bg-vault-surface border border-vault-border rounded-lg px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Total Sessions</p>
            <p className="text-lg font-bold font-mono text-vault-text">{sessions.length}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Rounds Fired</p>
            <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(totalRounds)}</p>
          </div>
          {uniqueFirearms.length > 1 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Platforms</p>
                <p className="text-lg font-bold font-mono text-vault-text">{uniqueFirearms.length}</p>
              </div>
            </>
          )}
        </div>

        {/* Firearm filter */}
        {uniqueFirearms.length > 1 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <button onClick={() => setFirearmFilter("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                firearmFilter === "ALL"
                  ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                  : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
              }`}>
              All Firearms
            </button>
            {uniqueFirearms.map((f) => (
              <button key={f.id} onClick={() => setFirearmFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                  firearmFilter === f.id
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
                }`}>
                {f.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">No range sessions yet</h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
              Log your first range session to start tracking your shooting history.
            </p>
            <Link href="/range"
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors">
              <Target className="w-4 h-4" />
              Log First Session
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session) => (
              <div key={session.id}
                className="bg-vault-surface border border-vault-border rounded-lg p-4 hover:border-vault-text-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-vault-text">{session.firearm.name}</span>
                      {session.build && (
                        <span className="text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                          {session.build.name}
                        </span>
                      )}
                      <span className="text-[10px] font-mono font-bold text-[#00C2FF] bg-[#00C2FF]/10 border border-[#00C2FF]/20 px-2 py-0.5 rounded">
                        {formatNumber(session.roundsFired)} rds
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-vault-text-faint flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatSessionDate(session.date)}</span>
                      </div>
                      {session.rangeName && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{session.rangeName}{session.rangeLocation ? ` · ${session.rangeLocation}` : ""}</span>
                        </div>
                      )}
                    </div>

                    {session.notes && (
                      <p className="text-xs text-vault-text-muted mt-2 line-clamp-2">{session.notes}</p>
                    )}
                  </div>

                  <button onClick={() => handleDelete(session.id)} disabled={deleting === session.id}
                    className="shrink-0 w-7 h-7 flex items-center justify-center text-vault-text-faint hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors disabled:opacity-50"
                    title="Delete session">
                    {deleting === session.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dropdown summary icon at bottom for spacing */}
        {filtered.length > 5 && (
          <div className="flex justify-center mt-6">
            <ChevronDown className="w-4 h-4 text-vault-text-faint" />
          </div>
        )}
      </div>
    </div>
  );
}
