"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Timer,
  Award,
  Target,
  Crosshair,
  Lock,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

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

const CATEGORIES = ["ACCURACY", "SPEED", "TACTICAL", "FUNDAMENTALS", "CUSTOM"];
const SCORING_TYPES = ["TIME", "SCORE", "TIME_AND_SCORE", "PASS_FAIL", "NOTES_ONLY"];
const SCORING_TYPE_LABELS: Record<string, string> = {
  TIME: "Time",
  SCORE: "Score",
  TIME_AND_SCORE: "Time + Score",
  PASS_FAIL: "Pass / Fail",
  NOTES_ONLY: "Notes Only",
};
const CATEGORY_COLORS: Record<string, string> = {
  ACCURACY: "text-[#00C853] border-[#00C853]/30 bg-[#00C853]/10",
  SPEED: "text-[#F5A623] border-[#F5A623]/30 bg-[#F5A623]/10",
  TACTICAL: "text-[#E53935] border-[#E53935]/30 bg-[#E53935]/10",
  FUNDAMENTALS: "text-[#00C2FF] border-[#00C2FF]/30 bg-[#00C2FF]/10",
  CUSTOM: "text-vault-text-muted border-vault-border bg-vault-surface",
};
const SCORING_ICONS: Record<string, React.ReactNode> = {
  TIME: <Timer className="w-3 h-3" />,
  SCORE: <Award className="w-3 h-3" />,
  TIME_AND_SCORE: <Target className="w-3 h-3" />,
  PASS_FAIL: <Crosshair className="w-3 h-3" />,
  NOTES_ONLY: <BookOpen className="w-3 h-3" />,
};

function TemplateForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: Partial<DrillTemplate>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [category, setCategory] = useState(initialValues?.category ?? "CUSTOM");
  const [scoringType, setScoringType] = useState(initialValues?.scoringType ?? "NOTES_ONLY");
  const [parTime, setParTime] = useState(initialValues?.parTime?.toString() ?? "");
  const [maxScore, setMaxScore] = useState(initialValues?.maxScore?.toString() ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name,
      description: description || null,
      category,
      scoringType,
      parTime: parTime ? parseFloat(parTime) : null,
      maxScore: maxScore ? parseInt(maxScore) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-vault-surface border border-[#00C2FF]/30 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-4 h-4 text-[#00C2FF]" />
        <span className="text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
          {initialValues?.id ? "Edit Template" : "New Drill Template"}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Drill Name <span className="text-[#E53935]">*</span></label>
          <input required type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wizard Drill, Standards Test..." className={INPUT_CLASS} />
        </div>

        <div>
          <label className={LABEL_CLASS}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT_CLASS}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Scoring Type</label>
          <select value={scoringType} onChange={(e) => setScoringType(e.target.value)} className={INPUT_CLASS}>
            {SCORING_TYPES.map((s) => (
              <option key={s} value={s}>{SCORING_TYPE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {(scoringType === "TIME" || scoringType === "TIME_AND_SCORE") && (
          <div>
            <label className={LABEL_CLASS}>Par Time (sec)</label>
            <input type="number" min={0} step={0.01} value={parTime} onChange={(e) => setParTime(e.target.value)}
              placeholder="e.g. 2.0" className={INPUT_CLASS} />
          </div>
        )}

        {(scoringType === "SCORE" || scoringType === "TIME_AND_SCORE") && (
          <div>
            <label className={LABEL_CLASS}>Max Score</label>
            <input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
              placeholder="e.g. 50" className={INPUT_CLASS} />
          </div>
        )}

        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Description</label>
          <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the drill procedure..."
            className={`${INPUT_CLASS} resize-none`} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-vault-text-muted border border-vault-border hover:text-vault-text transition-colors">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={submitting || !name}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 transition-colors">
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {initialValues?.id ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </form>
  );
}

export default function DrillLibraryPage() {
  const [templates, setTemplates] = useState<DrillTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DrillTemplate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/drill-templates");
      setTemplates(await res.json());
    } catch {
      setError("Failed to load drill templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTemplates(); }, []);

  async function handleCreate(values: Record<string, unknown>) {
    setFormSubmitting(true);
    try {
      const res = await fetch("/api/drill-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to create template");
      await fetchTemplates();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEdit(id: string, values: Record<string, unknown>) {
    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/drill-templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to update template");
      await fetchTemplates();
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/drill-templates/${id}`, { method: "DELETE" });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete template.");
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = categoryFilter === "ALL"
    ? templates
    : templates.filter((t) => t.category === categoryFilter);

  const builtIn = filtered.filter((t) => t.isBuiltIn);
  const custom = filtered.filter((t) => !t.isBuiltIn);

  return (
    <div className="min-h-full">
      <PageHeader title="DRILL LIBRARY" subtitle="Manage reusable drill templates for your training sessions" />

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935] flex-1">{error}</p>
            <button onClick={() => setError(null)}><X className="w-4 h-4 text-[#E53935]" /></button>
          </div>
        )}

        {/* Header actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            {["ALL", ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-mono ${
                  categoryFilter === cat
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/50"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          {!showCreateForm && !editingTemplate && (
            <button onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors">
              <Plus className="w-4 h-4" /> New Template
            </button>
          )}
        </div>

        {/* Create form */}
        {showCreateForm && (
          <TemplateForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            submitting={formSubmitting}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
          </div>
        ) : (
          <>
            {/* Custom templates */}
            {custom.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-3">Your Templates</p>
                <div className="space-y-3">
                  {custom.map((t) =>
                    editingTemplate?.id === t.id ? (
                      <TemplateForm
                        key={t.id}
                        initialValues={editingTemplate}
                        onSubmit={(values) => handleEdit(t.id, values)}
                        onCancel={() => setEditingTemplate(null)}
                        submitting={formSubmitting}
                      />
                    ) : (
                      <TemplateCard key={t.id} template={t}
                        onEdit={() => { setEditingTemplate(t); setShowCreateForm(false); }}
                        onDelete={() => handleDelete(t.id)}
                        deleting={deletingId === t.id}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {/* Built-in templates */}
            {builtIn.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-3">
                  Built-in Drills <span className="text-vault-text-faint normal-case tracking-normal">(read-only)</span>
                </p>
                <div className="space-y-3">
                  {builtIn.map((t) => (
                    <TemplateCard key={t.id} template={t} readOnly />
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-10 h-10 text-vault-text-faint mx-auto mb-3" />
                <p className="text-vault-text-muted">No templates in this category.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template, onEdit, onDelete, deleting, readOnly }: {
  template: DrillTemplate;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm text-vault-text">{template.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.CUSTOM}`}>
              {template.category}
            </span>
            {readOnly && (
              <span className="flex items-center gap-1 text-[10px] text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5" /> built-in
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-vault-text-muted mb-2">{template.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1 text-xs text-vault-text-faint">
              {SCORING_ICONS[template.scoringType]}
              {SCORING_TYPE_LABELS[template.scoringType]}
            </span>
            {template.parTime != null && (
              <span className="flex items-center gap-1 text-xs text-vault-text-faint">
                <Timer className="w-3 h-3" /> par {template.parTime}s
              </span>
            )}
            {template.maxScore != null && (
              <span className="flex items-center gap-1 text-xs text-vault-text-faint">
                <Award className="w-3 h-3" /> max {template.maxScore}
              </span>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit}
              className="p-1.5 rounded hover:bg-vault-border/40 text-vault-text-faint hover:text-vault-text transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} disabled={deleting}
              className="p-1.5 rounded hover:bg-[#E53935]/10 text-vault-text-faint hover:text-[#E53935] transition-colors disabled:opacity-50">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
