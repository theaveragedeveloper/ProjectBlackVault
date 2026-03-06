"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Trash2, ChevronLeft, TrendingUp } from "lucide-react";
import Link from "next/link";

interface DrillLog {
  id: string;
  drillName: string;
  templateId: string | null;
  template: { id: string; name: string; scoringType: string; parTime: number | null; maxScore: number | null } | null;
  performedAt: string;
  timeSeconds: number | null;
  hits: number | null;
  totalShots: number | null;
  accuracy: number | null;
  score: number | null;
  notes: string | null;
}

export default function DrillLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [log, setLog] = useState<DrillLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/drill-logs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setLog(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Delete this drill log entry?")) return;
    setDeleting(true);
    await fetch(`/api/drill-logs/${id}`, { method: "DELETE" });
    router.push("/range/log-drill");
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="p-6 text-center text-vault-text-muted">
        Drill log not found.{" "}
        <Link href="/range/log-drill" className="text-[#00C2FF] hover:underline">
          Log a new drill
        </Link>
      </div>
    );
  }

  const date = new Date(log.performedAt);
  const scoringType = log.template?.scoringType ?? "NOTES_ONLY";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[#00C2FF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-vault-text">{log.drillName}</h1>
            <p className="text-xs text-vault-text-faint">
              {date.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" })}{" "}
              at {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {log.templateId && (
            <Link
              href={`/range/drill-performance?templateId=${log.templateId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 text-[#00C2FF] text-xs hover:bg-[#00C2FF]/20 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Performance
            </Link>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <Link
        href="/range/log-drill"
        className="flex items-center gap-1 text-xs text-vault-text-faint hover:text-vault-text-muted transition-colors"
      >
        <ChevronLeft className="w-3 h-3" />
        Back
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(scoringType === "TIME" || scoringType === "TIME_AND_SCORE") && log.timeSeconds !== null && (
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <p className="text-xs text-vault-text-faint mb-1">Time</p>
            <p className="text-xl font-bold text-vault-text">
              {log.timeSeconds}
              <span className="text-sm font-normal text-vault-text-muted ml-1">s</span>
            </p>
            {log.template?.parTime && (
              <p className={`text-xs mt-0.5 ${log.timeSeconds <= log.template.parTime ? "text-green-400" : "text-orange-400"}`}>
                par: {log.template.parTime}s
              </p>
            )}
          </div>
        )}

        {(scoringType === "SCORE" || scoringType === "TIME_AND_SCORE") && log.score !== null && (
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <p className="text-xs text-vault-text-faint mb-1">Score</p>
            <p className="text-xl font-bold text-vault-text">
              {log.score}
              {log.template?.maxScore && (
                <span className="text-sm font-normal text-vault-text-muted ml-1">/ {log.template.maxScore}</span>
              )}
            </p>
          </div>
        )}

        {scoringType === "PASS_FAIL" && log.score !== null && (
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <p className="text-xs text-vault-text-faint mb-1">Result</p>
            <p className={`text-xl font-bold ${log.score === 1 ? "text-green-400" : "text-red-400"}`}>
              {log.score === 1 ? "PASS" : "FAIL"}
            </p>
          </div>
        )}

        {log.accuracy !== null && (
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <p className="text-xs text-vault-text-faint mb-1">Accuracy</p>
            <p className="text-xl font-bold text-vault-text">
              {log.accuracy.toFixed(1)}
              <span className="text-sm font-normal text-vault-text-muted ml-0.5">%</span>
            </p>
            {log.hits !== null && log.totalShots !== null && (
              <p className="text-xs text-vault-text-faint mt-0.5">
                {log.hits} / {log.totalShots} hits
              </p>
            )}
          </div>
        )}

        {log.template && (
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <p className="text-xs text-vault-text-faint mb-1">Drill</p>
            <p className="text-sm font-medium text-vault-text">{log.template.name}</p>
          </div>
        )}
      </div>

      {log.notes && (
        <div className="rounded-lg border border-vault-border bg-vault-surface p-4">
          <p className="text-xs text-vault-text-faint mb-2">Notes</p>
          <p className="text-sm text-vault-text-muted whitespace-pre-wrap">{log.notes}</p>
        </div>
      )}
    </div>
  );
}
