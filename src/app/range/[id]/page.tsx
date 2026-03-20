"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import {
  Target,
  ArrowLeft,
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Crosshair,
  PackageCheck,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  ChevronDown,
  Timer,
  Award,
  BookOpen,
  ListChecks,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-sm font-medium text-vault-text-muted mb-1.5";

interface DrillTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  scoringType: string;
  parTime: number | null;
  maxScore: number | null;
  isBuiltIn: boolean;
}

interface SessionDrill {
  id: string;
  drillName: string;
  templateId: string | null;
  template: DrillTemplate | null;
  timeSeconds: number | null;
  hits: number | null;
  totalShots: number | null;
  accuracy: number | null;
  score: number | null;
  notes: string | null;
  sortOrder: number;
}

interface AmmoLink {
  id: string;
  transaction: {
    id: string;
    type: string;
    quantity: number;
    transactedAt: string;
    stock: {
      caliber: string;
      brand: string;
      grainWeight: number | null;
      bulletType: string | null;
    };
  };
}

interface SessionFirearm {
  id: string;
  firearmId: string;
  roundsFired: number;
  firearm: { id: string; name: string; caliber: string };
  build: { id: string; name: string } | null;
}

interface RangeSession {
  id: string;
  date: string;
  roundsFired: number;
  rangeName: string | null;
  rangeLocation: string | null;
  notes: string | null;
  environment: string | null;
  temperatureF: number | null;
  windSpeedMph: number | null;
  windDirection: string | null;
  humidity: number | null;
  lightCondition: string | null;
  weatherNotes: string | null;
  targetDistanceYd: number | null;
  groupSizeIn: number | null;
  groupSizeMoa: number | null;
  numberOfGroups: number | null;
  groupNotes: string | null;
  sessionFirearms: SessionFirearm[];
  sessionDrills: SessionDrill[];
  ammoLinks: AmmoLink[];
}

const CATEGORY_COLORS: Record<string, string> = {
  ACCURACY: "text-[#00C853] border-[#00C853]/30 bg-[#00C853]/10",
  SPEED: "text-[#F5A623] border-[#F5A623]/30 bg-[#F5A623]/10",
  TACTICAL: "text-[#E53935] border-[#E53935]/30 bg-[#E53935]/10",
  FUNDAMENTALS: "text-[#00C2FF] border-[#00C2FF]/30 bg-[#00C2FF]/10",
  CUSTOM: "text-vault-text-muted border-vault-border bg-vault-surface",
};

const SCORING_FIELDS: Record<string, string[]> = {
  TIME: ["timeSeconds"],
  SCORE: ["score", "hits", "totalShots"],
  TIME_AND_SCORE: ["timeSeconds", "score", "hits", "totalShots"],
  PASS_FAIL: ["hits", "totalShots"],
  NOTES_ONLY: [],
};

function normalizeDrillName(name: string) {
  return name.trim().toLowerCase();
}

function findUniqueTemplateByNormalizedName(templates: DrillTemplate[], drillName: string) {
  const normalized = normalizeDrillName(drillName);
  const matches = templates.filter((t) => normalizeDrillName(t.name) === normalized);
  return matches.length === 1 ? matches[0] : undefined;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function toDateTimeLocalValue(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function DrillCard({ drill, onEdit, onDelete }: {
  drill: SessionDrill;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const par = drill.template?.parTime;
  const underPar = par && drill.timeSeconds && drill.timeSeconds < par;
  const overPar = par && drill.timeSeconds && drill.timeSeconds > par;

  return (
    <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-vault-text text-sm">{drill.drillName}</span>
            {drill.template && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${CATEGORY_COLORS[drill.template.category] ?? CATEGORY_COLORS.CUSTOM}`}>
                {drill.template.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded hover:bg-vault-border/40 text-vault-text-faint hover:text-vault-text transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded hover:bg-[#E53935]/10 text-vault-text-faint hover:text-[#E53935] transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {drill.timeSeconds != null && (
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-vault-text-faint" />
            <span className={`text-sm font-mono font-bold ${underPar ? "text-[#00C853]" : overPar ? "text-[#E53935]" : "text-vault-text"}`}>
              {drill.timeSeconds.toFixed(2)}s
            </span>
            {par && (
              <span className="text-xs text-vault-text-faint">/ par {par}s</span>
            )}
          </div>
        )}
        {drill.hits != null && (
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-vault-text-faint" />
            <span className="text-sm font-mono text-vault-text">
              {drill.hits}{drill.totalShots != null ? `/${drill.totalShots}` : ""} hits
            </span>
          </div>
        )}
        {drill.accuracy != null && (
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-vault-text-faint" />
            <span className={`text-sm font-mono font-bold ${drill.accuracy >= 90 ? "text-[#00C853]" : drill.accuracy >= 70 ? "text-[#F5A623]" : "text-[#E53935]"}`}>
              {drill.accuracy.toFixed(1)}%
            </span>
          </div>
        )}
        {drill.score != null && (
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-vault-text-faint" />
            <span className="text-sm font-mono text-vault-text">
              {drill.score}{drill.template?.maxScore != null ? `/${drill.template.maxScore}` : ""}
              {drill.template?.maxScore != null && (
                <span className="text-vault-text-faint text-xs ml-1">
                  ({((drill.score / drill.template.maxScore) * 100).toFixed(0)}%)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {drill.notes && (
        <p className="text-xs text-vault-text-muted mt-2 border-t border-vault-border pt-2">{drill.notes}</p>
      )}
    </div>
  );
}

function DrillForm({ templates, initialValues, onSubmit, onCancel, submitting }: {
  templates: DrillTemplate[];
  initialValues?: Partial<SessionDrill>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const matchedTemplateFromName = !initialValues?.templateId && initialValues?.drillName
    ? findUniqueTemplateByNormalizedName(templates, initialValues.drillName ?? "")
    : undefined;

  const [templateId, setTemplateId] = useState(initialValues?.templateId ?? matchedTemplateFromName?.id ?? "");
  const [templateTouched, setTemplateTouched] = useState(false);
  const [drillName, setDrillName] = useState(initialValues?.drillName ?? "");
  const [timeSeconds, setTimeSeconds] = useState(initialValues?.timeSeconds?.toString() ?? "");
  const [hits, setHits] = useState(initialValues?.hits?.toString() ?? "");
  const [totalShots, setTotalShots] = useState(initialValues?.totalShots?.toString() ?? "");
  const [accuracy, setAccuracy] = useState(initialValues?.accuracy?.toString() ?? "");
  const [score, setScore] = useState(initialValues?.score?.toString() ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const effectiveTemplateId = templateTouched
    ? templateId
    : (templateId || initialValues?.templateId || matchedTemplateFromName?.id || "");

  const selectedTemplate = templates.find((t) => t.id === effectiveTemplateId);
  const activeFields = selectedTemplate
    ? SCORING_FIELDS[selectedTemplate.scoringType] ?? []
    : ["timeSeconds", "hits", "totalShots", "accuracy", "score"];

  // Auto-compute accuracy from hits/totalShots
  const computedAccuracy =
    hits && totalShots && parseFloat(totalShots) > 0
      ? ((parseFloat(hits) / parseFloat(totalShots)) * 100).toFixed(1)
      : accuracy;

  function handleTemplateChange(id: string) {
    setTemplateTouched(true);
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl && !initialValues?.drillName) {
      setDrillName(tpl.name);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      templateId: effectiveTemplateId || null,
      drillName,
      timeSeconds: timeSeconds ? parseFloat(timeSeconds) : null,
      hits: hits ? parseInt(hits) : null,
      totalShots: totalShots ? parseInt(totalShots) : null,
      accuracy: computedAccuracy ? parseFloat(computedAccuracy) : null,
      score: score ? parseFloat(score) : null,
      notes: notes || null,
    });
  }

  const byCategory: Record<string, DrillTemplate[]> = {};
  for (const t of templates) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-vault-surface border border-[#00C2FF]/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks className="w-4 h-4 text-[#00C2FF]" />
        <span className="text-sm font-semibold text-[#00C2FF]">
          {initialValues?.id ? "Edit Drill" : "Add Drill"}
        </span>
      </div>

      {/* Template picker */}
      <div>
        <label className={LABEL_CLASS}>
          <BookOpen className="w-3 h-3 inline mr-1" />
          Drill Template (or enter custom name below)
        </label>
        <div className="relative">
          <select value={effectiveTemplateId} onChange={(e) => handleTemplateChange(e.target.value)} className={INPUT_CLASS}>
            <option value="">Custom / No Template</option>
            {Object.entries(byCategory).map(([cat, tpls]) => (
              <optgroup key={cat} label={cat}>
                {tpls.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.parTime ? ` (par ${t.parTime}s)` : ""}{t.maxScore ? ` (max ${t.maxScore})` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
        </div>
        {selectedTemplate?.description && (
          <p className="text-xs text-vault-text-faint mt-1">{selectedTemplate.description}</p>
        )}
      </div>

      {/* Drill name */}
      <div>
        <label className={LABEL_CLASS}>Drill Name <span className="text-[#E53935]">*</span></label>
        <input required type="text" value={drillName} onChange={(e) => setDrillName(e.target.value)}
          placeholder="e.g. Bill Drill, Custom Transition..." className={INPUT_CLASS} />
      </div>

      {/* Scored fields — shown based on template scoring type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(activeFields.includes("timeSeconds") || !selectedTemplate) && (
          <div>
            <label className={LABEL_CLASS}>
              <Timer className="w-3 h-3 inline mr-1" />
              Time (sec){selectedTemplate?.parTime ? ` · par ${selectedTemplate.parTime}s` : ""}
            </label>
            <input type="number" min={0} step={0.01} value={timeSeconds} onChange={(e) => setTimeSeconds(e.target.value)}
              placeholder="2.45" className={INPUT_CLASS} />
          </div>
        )}
        {(activeFields.includes("hits") || !selectedTemplate) && (
          <div>
            <label className={LABEL_CLASS}>Hits</label>
            <input type="number" min={0} value={hits} onChange={(e) => setHits(e.target.value)}
              placeholder="6" className={INPUT_CLASS} />
          </div>
        )}
        {(activeFields.includes("totalShots") || !selectedTemplate) && (
          <div>
            <label className={LABEL_CLASS}>Total Shots</label>
            <input type="number" min={0} value={totalShots} onChange={(e) => setTotalShots(e.target.value)}
              placeholder="6" className={INPUT_CLASS} />
          </div>
        )}
        {(activeFields.includes("score") || !selectedTemplate) && (
          <div>
            <label className={LABEL_CLASS}>
              Score{selectedTemplate?.maxScore ? ` / ${selectedTemplate.maxScore}` : ""}
            </label>
            <input type="number" min={0} value={score} onChange={(e) => setScore(e.target.value)}
              placeholder={selectedTemplate?.maxScore ? `0–${selectedTemplate.maxScore}` : "pts"} className={INPUT_CLASS} />
          </div>
        )}
        {/* Accuracy: shown always if hits/shots given; otherwise as manual field */}
        <div>
          <label className={LABEL_CLASS}>Accuracy %</label>
          <input type="number" min={0} max={100} step={0.1}
            value={computedAccuracy !== accuracy ? computedAccuracy : accuracy}
            onChange={(e) => setAccuracy(e.target.value)}
            placeholder={computedAccuracy && computedAccuracy !== accuracy ? computedAccuracy : "auto"}
            className={`${INPUT_CLASS} ${computedAccuracy && computedAccuracy !== accuracy ? "opacity-60" : ""}`}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Notes</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Smooth draw, front sight focus, split times consistent..."
          className={`${INPUT_CLASS} resize-none`} />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-vault-text-muted border border-vault-border hover:text-vault-text transition-colors">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={submitting || !drillName}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initialValues?.id ? "Save Changes" : "Add Drill"}
        </button>
      </div>
    </form>
  );
}

export default function RangeSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<RangeSession | null>(null);
  const [templates, setTemplates] = useState<DrillTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDrillForm, setShowDrillForm] = useState(false);
  const [editingDrill, setEditingDrill] = useState<SessionDrill | null>(null);
  const [drillSubmitting, setDrillSubmitting] = useState(false);
  const [deletingDrillId, setDeletingDrillId] = useState<string | null>(null);
  const [deleteSessionConfirm, setDeleteSessionConfirm] = useState(false);
  const [sessionDateInput, setSessionDateInput] = useState("");
  const [savingSessionDate, setSavingSessionDate] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/range-sessions/${id}`);
      if (!res.ok) throw new Error("Session not found");
      const json = await res.json();
      setSession(json);
      setSessionDateInput(toDateTimeLocalValue(json.date));
    } catch {
      setError("Failed to load session.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSession();
    fetch("/api/drill-templates")
      .then((r) => r.json())
      .then(setTemplates)
      .catch(() => {});
  }, [fetchSession]);

  async function handleAddDrill(values: Record<string, unknown>) {
    setDrillSubmitting(true);
    try {
      const res = await fetch(`/api/range-sessions/${id}/drills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to add drill");
      await fetchSession();
      setShowDrillForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add drill");
    } finally {
      setDrillSubmitting(false);
    }
  }

  async function handleEditDrill(drillId: string, values: Record<string, unknown>) {
    setDrillSubmitting(true);
    try {
      const res = await fetch(`/api/range-sessions/${id}/drills/${drillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update drill");
      await fetchSession();
      setEditingDrill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update drill");
    } finally {
      setDrillSubmitting(false);
    }
  }

  async function handleDeleteDrill(drillId: string) {
    setDeletingDrillId(drillId);
    try {
      await fetch(`/api/range-sessions/${id}/drills/${drillId}`, { method: "DELETE" });
      await fetchSession();
    } finally {
      setDeletingDrillId(null);
    }
  }

  async function handleDeleteSession() {
    try {
      await fetch(`/api/range-sessions/${id}`, { method: "DELETE" });
      router.push("/range/history");
    } catch {
      setError("Failed to delete session.");
    }
  }

  async function handleSaveSessionDate() {
    if (!session || !sessionDateInput) return;

    setSavingSessionDate(true);
    setError(null);

    try {
      const res = await fetch(`/api/range-sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildId: session.build?.id ?? null,
          roundsFired: session.roundsFired,
          rangeName: session.rangeName,
          rangeLocation: session.rangeLocation,
          notes: session.notes,
          date: new Date(sessionDateInput).toISOString(),
          environment: session.environment,
          temperatureF: session.temperatureF,
          windSpeedMph: session.windSpeedMph,
          windDirection: session.windDirection,
          humidity: session.humidity,
          lightCondition: session.lightCondition,
          weatherNotes: session.weatherNotes,
          targetDistanceYd: session.targetDistanceYd,
          groupSizeIn: session.groupSizeIn,
          groupSizeMoa: session.groupSizeMoa,
          numberOfGroups: session.numberOfGroups,
          groupNotes: session.groupNotes,
          ammoTransactionIds: session.ammoLinks.map((link) => link.transaction.id),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to update session date");
      }

      setSession(json);
      setSessionDateInput(toDateTimeLocalValue(json.date));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session date");
    } finally {
      setSavingSessionDate(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-full">
        <PageHeader title="Session Details" subtitle="" />
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#E53935]" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const hasEnvData = session.environment || session.temperatureF != null || session.windSpeedMph != null || session.lightCondition;
  const hasGroupData = session.targetDistanceYd != null || session.groupSizeIn != null;

  return (
    <div className="min-h-full">
      <PageHeader
        title={session.sessionFirearms.map((sf) => sf.firearm.name).join(" + ")}
        subtitle={formatDate(session.date)}
      />

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935] flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-[#E53935]" /></button>
          </div>
        )}

        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Link href="/range/history"
            className="flex items-center gap-1.5 text-sm text-vault-text-muted hover:text-vault-text transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to History
          </Link>
          <div className="flex items-center gap-2">
            {!deleteSessionConfirm ? (
              <button onClick={() => setDeleteSessionConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#E53935]/70 border border-[#E53935]/20 hover:bg-[#E53935]/10 hover:text-[#E53935] transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Session
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#E53935]">Are you sure?</span>
                <button onClick={handleDeleteSession}
                  className="px-3 py-1.5 rounded-md text-sm bg-[#E53935] text-white hover:bg-[#E53935]/80 transition-colors">
                  Yes, Delete
                </button>
                <button onClick={() => setDeleteSessionConfirm(false)}
                  className="px-3 py-1.5 rounded-md text-sm border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors">
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Session summary strip */}
        <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className={LABEL_CLASS}>Session Date &amp; Time</label>
              <input
                type="datetime-local"
                value={sessionDateInput}
                onChange={(e) => setSessionDateInput(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="button"
              onClick={handleSaveSessionDate}
              disabled={savingSessionDate || !sessionDateInput}
              className="h-10 px-4 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {savingSessionDate ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingSessionDate ? "Saving..." : "Save Date"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Rounds Fired", value: formatNumber(session.roundsFired), unit: "rds", color: "text-[#00C2FF]" },
            { label: "Calibers", value: Array.from(new Set(session.sessionFirearms.map((sf) => sf.firearm.caliber))).join(", "), color: "text-vault-text" },
            { label: "Builds", value: session.sessionFirearms.filter((sf) => sf.build).map((sf) => sf.build!.name).join(", ") || "—", color: "text-vault-text" },
            { label: "Range", value: session.rangeName ?? "—", color: "text-vault-text" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-vault-surface border border-vault-border rounded-lg p-3">
              <p className="text-xs text-vault-text-faint mb-1">{label}</p>
              <p className={`text-sm font-medium truncate ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-4">
            {/* Environment card */}
            {hasEnvData && (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-4 h-4 text-[#00C2FF]" />
                  <h3 className="text-sm font-semibold text-vault-text-muted">Environment</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {session.environment && (
                    <span className="text-xs px-2 py-1 rounded border border-vault-border bg-vault-bg text-vault-text-muted font-mono">
                      {session.environment}
                    </span>
                  )}
                  {session.temperatureF != null && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-vault-border bg-vault-bg text-vault-text-muted">
                      <Thermometer className="w-3 h-3" />{session.temperatureF}°F
                    </span>
                  )}
                  {session.windSpeedMph != null && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-vault-border bg-vault-bg text-vault-text-muted">
                      <Wind className="w-3 h-3" />{session.windSpeedMph} mph{session.windDirection ? ` ${session.windDirection}` : ""}
                    </span>
                  )}
                  {session.humidity != null && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-vault-border bg-vault-bg text-vault-text-muted">
                      <Droplets className="w-3 h-3" />{session.humidity}%
                    </span>
                  )}
                  {session.lightCondition && (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-vault-border bg-vault-bg text-vault-text-muted">
                      <Sun className="w-3 h-3" />{session.lightCondition.replace("_", " ")}
                    </span>
                  )}
                </div>
                {session.weatherNotes && (
                  <p className="text-xs text-vault-text-muted border-t border-vault-border pt-2">{session.weatherNotes}</p>
                )}
              </div>
            )}

            {/* Shot group card */}
            {hasGroupData && (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crosshair className="w-4 h-4 text-[#00C2FF]" />
                  <h3 className="text-sm font-semibold text-vault-text-muted">Shot Groups</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {session.targetDistanceYd != null && (
                    <div>
                      <p className="text-xs text-vault-text-faint mb-0.5">Distance</p>
                      <p className="text-sm font-mono text-vault-text">{session.targetDistanceYd} yd</p>
                    </div>
                  )}
                  {session.numberOfGroups != null && (
                    <div>
                      <p className="text-xs text-vault-text-faint mb-0.5">Groups</p>
                      <p className="text-sm font-mono text-vault-text">{session.numberOfGroups}</p>
                    </div>
                  )}
                  {session.groupSizeIn != null && (
                    <div>
                      <p className="text-xs text-vault-text-faint mb-0.5">Best Group</p>
                      <p className="text-sm font-mono text-[#00C853] font-bold">{session.groupSizeIn}&quot;</p>
                    </div>
                  )}
                  {session.groupSizeMoa != null && (
                    <div>
                      <p className="text-xs text-vault-text-faint mb-0.5">Best Group (MOA)</p>
                      <p className="text-sm font-mono text-[#00C853] font-bold">{session.groupSizeMoa.toFixed(2)} MOA</p>
                    </div>
                  )}
                </div>
                {session.groupNotes && (
                  <p className="text-xs text-vault-text-muted border-t border-vault-border pt-2 mt-3">{session.groupNotes}</p>
                )}
              </div>
            )}

            {/* Ammo used card */}
            {session.ammoLinks.length > 0 && (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PackageCheck className="w-4 h-4 text-[#00C2FF]" />
                  <h3 className="text-sm font-semibold text-vault-text-muted">Ammo Used</h3>
                </div>
                <div className="space-y-2">
                  {session.ammoLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between py-1.5 border-b border-vault-border last:border-0">
                      <div>
                        <p className="text-sm text-vault-text">
                          {link.transaction.stock.brand}
                          {link.transaction.stock.grainWeight ? ` ${link.transaction.stock.grainWeight}gr` : ""}
                          {link.transaction.stock.bulletType ? ` ${link.transaction.stock.bulletType}` : ""}
                        </p>
                        <p className="text-xs text-vault-text-faint">{link.transaction.stock.caliber}</p>
                      </div>
                      <span className="text-sm font-mono text-[#F5A623]">{formatNumber(link.transaction.quantity)} rds</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes card */}
            {session.notes && (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                <p className="text-sm font-medium text-vault-text-faint mb-2">Session Notes</p>
                <p className="text-sm text-vault-text-muted whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </div>

          {/* Right column — Drills */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-[#00C2FF]" />
                <h3 className="text-sm font-semibold text-vault-text-muted">
                  Drills ({session.sessionDrills.length})
                </h3>
              </div>
              {!showDrillForm && !editingDrill && (
                <button onClick={() => setShowDrillForm(true)}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] border border-[#00C2FF]/30 px-2.5 py-1 rounded-md hover:bg-[#00C2FF]/10 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Drill
                </button>
              )}
            </div>

            {/* Add drill form */}
            {showDrillForm && !editingDrill && (
              <DrillForm
                templates={templates}
                onSubmit={handleAddDrill}
                onCancel={() => setShowDrillForm(false)}
                submitting={drillSubmitting}
              />
            )}

            {/* Drill list */}
            {session.sessionDrills.length === 0 && !showDrillForm ? (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-6 text-center">
                <ListChecks className="w-8 h-8 text-vault-text-faint mx-auto mb-2" />
                <p className="text-sm text-vault-text-muted mb-3">No drills logged for this session.</p>
                <button onClick={() => setShowDrillForm(true)}
                  className="flex items-center gap-1.5 text-xs text-[#00C2FF] border border-[#00C2FF]/30 px-3 py-1.5 rounded-md hover:bg-[#00C2FF]/10 transition-colors mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Add Your First Drill
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {session.sessionDrills.map((drill) =>
                  editingDrill?.id === drill.id ? (
                    <DrillForm
                      key={drill.id}
                      templates={templates}
                      initialValues={editingDrill}
                      onSubmit={(values) => handleEditDrill(drill.id, values)}
                      onCancel={() => setEditingDrill(null)}
                      submitting={drillSubmitting}
                    />
                  ) : (
                    <DrillCard
                      key={drill.id}
                      drill={drill}
                      onEdit={() => { setEditingDrill(drill); setShowDrillForm(false); }}
                      onDelete={() => {
                        if (deletingDrillId !== drill.id) handleDeleteDrill(drill.id);
                      }}
                    />
                  )
                )}
              </div>
            )}

            {/* Template library hint */}
            {templates.length > 0 && (
              <p className="text-xs text-vault-text-faint text-center">
                {templates.filter((t) => t.isBuiltIn).length} built-in drill templates available ·{" "}
                <Link href="/range/drills" className="text-[#00C2FF] hover:underline">
                  Manage your library
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
