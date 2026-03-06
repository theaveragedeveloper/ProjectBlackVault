"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, CheckCircle, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DrillTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  scoringType: string;
  parTime: number | null;
  maxScore: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  ACCURACY: "Accuracy",
  SPEED: "Speed",
  TACTICAL: "Tactical",
  FUNDAMENTALS: "Fundamentals",
  CUSTOM: "Custom",
};

export default function LogDrillPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DrillTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<{ id: string; templateId: string | null; drillName: string } | null>(null);

  const [form, setForm] = useState({
    templateId: "",
    drillName: "",
    performedAt: new Date().toISOString().slice(0, 16),
    timeSeconds: "",
    hits: "",
    totalShots: "",
    score: "",
    notes: "",
    passFail: "PASS" as "PASS" | "FAIL",
  });

  const selectedTemplate = templates.find((t) => t.id === form.templateId);
  const scoringType = selectedTemplate?.scoringType ?? "NOTES_ONLY";

  useEffect(() => {
    fetch("/api/drill-templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleTemplateChange(templateId: string) {
    const t = templates.find((t) => t.id === templateId);
    setForm((prev) => ({
      ...prev,
      templateId,
      drillName: t ? t.name : prev.drillName,
    }));
  }

  function computeAccuracy() {
    const hits = parseFloat(form.hits);
    const total = parseFloat(form.totalShots);
    if (!isNaN(hits) && !isNaN(total) && total > 0) {
      return Math.round((hits / total) * 1000) / 10;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.drillName.trim()) return;
    setSubmitting(true);

    let score: number | null = null;
    if (scoringType === "PASS_FAIL") {
      score = form.passFail === "PASS" ? 1 : 0;
    } else if (form.score !== "") {
      score = parseFloat(form.score);
    }

    const accuracy = computeAccuracy();

    const payload = {
      templateId: form.templateId || null,
      drillName: form.drillName.trim(),
      performedAt: new Date(form.performedAt).toISOString(),
      timeSeconds: form.timeSeconds !== "" ? parseFloat(form.timeSeconds) : null,
      hits: form.hits !== "" ? parseInt(form.hits) : null,
      totalShots: form.totalShots !== "" ? parseInt(form.totalShots) : null,
      accuracy,
      score,
      notes: form.notes.trim() || null,
    };

    try {
      const res = await fetch("/api/drill-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      const log = await res.json();
      setSaved({ id: log.id, templateId: log.templateId, drillName: log.drillName });
    } catch {
      alert("Failed to save drill log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="rounded-xl border border-[#00C2FF]/30 bg-[#00C2FF]/5 p-8 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-[#00C2FF] mx-auto" />
          <h2 className="text-xl font-bold text-vault-text">Drill Logged</h2>
          <p className="text-vault-text-muted text-sm">
            <span className="text-vault-text font-medium">{saved.drillName}</span> has been saved.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            {saved.templateId && (
              <Link
                href={`/range/drill-performance?templateId=${saved.templateId}`}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                View Performance Graph
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => {
                setSaved(null);
                setForm({
                  templateId: "",
                  drillName: "",
                  performedAt: new Date().toISOString().slice(0, 16),
                  timeSeconds: "",
                  hits: "",
                  totalShots: "",
                  score: "",
                  notes: "",
                  passFail: "PASS",
                });
              }}
              className="px-4 py-2 rounded-md border border-vault-border text-vault-text-muted text-sm hover:text-vault-text hover:bg-vault-border transition-colors"
            >
              Log Another Drill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
          <ClipboardList className="w-4 h-4 text-[#00C2FF]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-vault-text tracking-wide">Log a Drill</h1>
          <p className="text-xs text-vault-text-faint">Record standalone drill performance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Template selector */}
        <fieldset className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-4">
          <legend className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest px-1">
            Drill
          </legend>

          <div className="space-y-1.5">
            <label className="text-xs text-vault-text-muted">Drill Template (optional)</label>
            <select
              value={form.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-[#00C2FF]/50"
              disabled={loading}
            >
              <option value="">— Custom / No Template —</option>
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const group = templates.filter((t) => t.category === cat);
                if (!group.length) return null;
                return (
                  <optgroup key={cat} label={label}>
                    {group.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-vault-text-muted">
              Drill Name <span className="text-[#E53935]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.drillName}
              onChange={(e) => setForm((p) => ({ ...p, drillName: e.target.value }))}
              placeholder="e.g. Bill Drill, El Presidente..."
              className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-vault-text-muted">Date &amp; Time</label>
            <input
              type="datetime-local"
              value={form.performedAt}
              onChange={(e) => setForm((p) => ({ ...p, performedAt: e.target.value }))}
              className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-[#00C2FF]/50"
            />
          </div>

          {selectedTemplate?.description && (
            <p className="text-xs text-vault-text-faint italic">{selectedTemplate.description}</p>
          )}
        </fieldset>

        {/* Performance fields */}
        <fieldset className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-4">
          <legend className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest px-1">
            Performance
          </legend>

          {/* Time */}
          {(scoringType === "TIME" || scoringType === "TIME_AND_SCORE") && (
            <div className="space-y-1.5">
              <label className="text-xs text-vault-text-muted">
                Time (seconds)
                {selectedTemplate?.parTime && (
                  <span className="ml-2 text-vault-text-faint">par: {selectedTemplate.parTime}s</span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.timeSeconds}
                onChange={(e) => setForm((p) => ({ ...p, timeSeconds: e.target.value }))}
                placeholder="e.g. 4.32"
                className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50"
              />
            </div>
          )}

          {/* Score */}
          {(scoringType === "SCORE" || scoringType === "TIME_AND_SCORE") && (
            <div className="space-y-1.5">
              <label className="text-xs text-vault-text-muted">
                Score
                {selectedTemplate?.maxScore && (
                  <span className="ml-2 text-vault-text-faint">max: {selectedTemplate.maxScore}</span>
                )}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.score}
                onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
                placeholder="e.g. 85"
                className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50"
              />
            </div>
          )}

          {/* Pass/Fail */}
          {scoringType === "PASS_FAIL" && (
            <div className="space-y-1.5">
              <label className="text-xs text-vault-text-muted">Result</label>
              <div className="flex gap-3">
                {(["PASS", "FAIL"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, passFail: v }))}
                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                      form.passFail === v
                        ? v === "PASS"
                          ? "bg-green-500/20 border-green-500/40 text-green-400"
                          : "bg-red-500/20 border-red-500/40 text-red-400"
                        : "border-vault-border text-vault-text-muted hover:bg-vault-border"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Hits & Total Shots */}
          {scoringType !== "NOTES_ONLY" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-vault-text-muted">Hits</label>
                <input
                  type="number"
                  min="0"
                  value={form.hits}
                  onChange={(e) => setForm((p) => ({ ...p, hits: e.target.value }))}
                  placeholder="e.g. 6"
                  className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-vault-text-muted">Total Shots</label>
                <input
                  type="number"
                  min="0"
                  value={form.totalShots}
                  onChange={(e) => setForm((p) => ({ ...p, totalShots: e.target.value }))}
                  placeholder="e.g. 6"
                  className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50"
                />
              </div>
            </div>
          )}

          {/* Auto accuracy */}
          {computeAccuracy() !== null && (
            <p className="text-xs text-[#00C2FF]">
              Accuracy: <span className="font-semibold">{computeAccuracy()}%</span>
            </p>
          )}
        </fieldset>

        {/* Notes */}
        <fieldset className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-3">
          <legend className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest px-1">
            Notes
          </legend>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Observations, conditions, areas to improve..."
            className="w-full bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:outline-none focus:border-[#00C2FF]/50 resize-none"
          />
        </fieldset>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !form.drillName.trim()}
            className="flex-1 py-2.5 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm font-semibold hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Drill Log"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 rounded-md border border-vault-border text-vault-text-muted text-sm hover:text-vault-text hover:bg-vault-border transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
