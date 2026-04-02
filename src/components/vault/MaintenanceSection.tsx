"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Wrench,
} from "lucide-react";

type LogEntry = {
  id: string;
  date: string;
  notes: string;
  roundCount: number | null;
  createdAt: string;
};

type Props = {
  firearmId: string;
  lastMaintenanceDate: string | null;
  maintenanceIntervalDays: number | null;
  initialLogs: LogEntry[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function computeStatus(lastDate: string | null, intervalDays: number | null) {
  if (!lastDate || !intervalDays) return { label: "Neutral", style: "text-vault-text-faint border-vault-border" };
  const next = new Date(new Date(lastDate).getTime() + intervalDays * 86400000);
  const days = Math.ceil((next.getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Due", style: "text-[#E53935] border-[#E53935]/40" };
  if (days <= 14) return { label: "Upcoming", style: "text-[#F5A623] border-[#F5A623]/40" };
  return { label: "On Track", style: "text-[#00C853] border-[#00C853]/40" };
}

function computeNextDue(lastDate: string | null, intervalDays: number | null): string | null {
  if (!lastDate || !intervalDays) return null;
  return new Date(new Date(lastDate).getTime() + intervalDays * 86400000).toISOString();
}

export function MaintenanceSection({ firearmId, lastMaintenanceDate: initialLastDate, maintenanceIntervalDays: initialInterval, initialLogs }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState(initialLastDate);
  const [maintenanceIntervalDays, setMaintenanceIntervalDays] = useState(initialInterval);

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formRoundCount, setFormRoundCount] = useState("");
  const [formSetNextDue, setFormSetNextDue] = useState(false);
  const [formNextDueDate, setFormNextDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Delete confirm state: entryId | null
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const status = computeStatus(lastMaintenanceDate, maintenanceIntervalDays);
  const nextDue = computeNextDue(lastMaintenanceDate, maintenanceIntervalDays);

  async function handleSave() {
    if (!formDate || !formNotes.trim()) {
      setSaveError("Date and notes are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        date: formDate,
        notes: formNotes.trim(),
      };
      if (formRoundCount) body.roundCount = parseInt(formRoundCount, 10);
      if (formSetNextDue && formNextDueDate) body.nextDueDate = formNextDueDate;

      const res = await fetch(`/api/firearms/${firearmId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Failed to save.");
        return;
      }
      const newEntry: LogEntry = await res.json();
      setLogs((prev) => [newEntry, ...prev]);

      // Update local maintenance state if nextDueDate was set
      if (formSetNextDue && formNextDueDate) {
        setLastMaintenanceDate(new Date(formDate).toISOString());
        const intervalMs = new Date(formNextDueDate).getTime() - new Date(formDate).getTime();
        const days = Math.round(intervalMs / 86400000);
        setMaintenanceIntervalDays(days > 0 ? days : null);
      }

      // Reset form
      setFormDate(new Date().toISOString().split("T")[0]);
      setFormNotes("");
      setFormRoundCount("");
      setFormSetNextDue(false);
      setFormNextDueDate("");
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/firearms/${firearmId}/maintenance/${entryId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => l.id !== entryId));
      }
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  return (
    <aside className="bg-vault-surface border border-vault-border rounded-lg h-fit">
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-vault-text-faint" />
          <h3 className="text-sm font-semibold text-vault-text">Maintenance Log</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${status.style}`}>
            {status.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-vault-text-faint" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-vault-text-faint" />
          )}
        </div>
      </button>

      {/* Collapsed summary */}
      {!expanded && (
        <div className="px-4 pb-3 space-y-1 text-xs border-t border-vault-border pt-3">
          <p className="text-vault-text-muted">
            Last serviced:{" "}
            <span className="text-vault-text">
              {lastMaintenanceDate ? formatDate(lastMaintenanceDate) : "—"}
            </span>
          </p>
          <p className="text-vault-text-muted">
            Next due:{" "}
            <span className="text-vault-text">{nextDue ? formatDate(nextDue) : "—"}</span>
          </p>
          <p className="text-vault-text-muted">
            Entries:{" "}
            <span className="text-vault-text">{logs.length}</span>
          </p>
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-vault-border px-4 pb-4 pt-3 space-y-3">
          {/* Stats row */}
          <div className="space-y-1 text-xs">
            <p className="text-vault-text-muted">
              Last serviced:{" "}
              <span className="text-vault-text">
                {lastMaintenanceDate ? formatDate(lastMaintenanceDate) : "—"}
              </span>
            </p>
            <p className="text-vault-text-muted">
              Interval:{" "}
              <span className="text-vault-text">
                {maintenanceIntervalDays ? `${maintenanceIntervalDays} days` : "—"}
              </span>
            </p>
            <p className="text-vault-text-muted">
              Next due:{" "}
              <span className="text-vault-text">{nextDue ? formatDate(nextDue) : "—"}</span>
            </p>
          </div>

          {/* Add Entry button */}
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors w-full justify-center"
            >
              <Plus className="w-3 h-3" />
              Add Entry
            </button>
          )}

          {/* Add Entry form */}
          {showForm && (
            <div className="bg-vault-bg border border-vault-border rounded-lg p-3 space-y-3">
              <p className="text-xs font-semibold text-vault-text">New Entry</p>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] text-vault-text-muted mb-1">Date <span className="text-[#E53935]">*</span></label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1.5 text-xs text-vault-text focus:outline-none focus:border-[#00C2FF]/60"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-vault-text-muted mb-1">Notes <span className="text-[#E53935]">*</span></label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="e.g. Full cleaning after range day"
                    className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1.5 text-xs text-vault-text placeholder:text-vault-text-faint focus:outline-none focus:border-[#00C2FF]/60 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-vault-text-muted mb-1">Rounds at service (optional)</label>
                  <input
                    type="number"
                    value={formRoundCount}
                    onChange={(e) => setFormRoundCount(e.target.value)}
                    placeholder="e.g. 2500"
                    min={0}
                    className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1.5 text-xs text-vault-text placeholder:text-vault-text-faint focus:outline-none focus:border-[#00C2FF]/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-[11px] text-vault-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formSetNextDue}
                      onChange={(e) => setFormSetNextDue(e.target.checked)}
                      className="accent-[#00C2FF]"
                    />
                    Set next due date
                  </label>
                  {formSetNextDue && (
                    <input
                      type="date"
                      value={formNextDueDate}
                      onChange={(e) => setFormNextDueDate(e.target.value)}
                      className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1.5 text-xs text-vault-text focus:outline-none focus:border-[#00C2FF]/60"
                    />
                  )}
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-[#E53935]">{saveError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setSaveError(null); }}
                  className="flex-1 text-xs bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Log entries */}
          {logs.length === 0 ? (
            <p className="text-xs text-vault-text-faint text-center py-2">No maintenance events logged yet.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((entry) => (
                <div key={entry.id} className="rounded border border-vault-border bg-vault-bg px-2.5 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-mono text-vault-text-muted">{formatDate(entry.date)}</p>
                      <p className="text-xs text-vault-text mt-0.5 leading-snug whitespace-pre-wrap">{entry.notes}</p>
                      {entry.roundCount != null && (
                        <p className="text-[11px] text-vault-text-faint mt-0.5">{entry.roundCount.toLocaleString()} rounds at service</p>
                      )}
                    </div>

                    {/* Delete control */}
                    <div className="shrink-0">
                      {confirmDelete === entry.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-vault-text-muted">Delete?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleting}
                            className="text-[11px] text-[#E53935] hover:underline disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <span className="text-vault-text-faint text-[11px]">/</span>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="text-[11px] text-vault-text-muted hover:text-vault-text"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(entry.id)}
                          className="text-vault-text-faint hover:text-[#E53935] transition-colors p-0.5"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
