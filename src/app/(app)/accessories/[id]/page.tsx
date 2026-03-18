"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SLOT_TYPE_LABELS } from "@/lib/types";
import {
  ArrowLeft,
  Shield,
  Target,
  Calendar,
  DollarSign,
  Layers,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Camera,
  X,
  FileText,
  Upload,
  ExternalLink,
} from "lucide-react";
import PhotoGallery from "@/components/shared/PhotoGallery";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";
import BatterySettingsFields from "@/components/shared/BatterySettingsFields";

const SLOT_TYPE_LABELS_LOCAL: Record<string, string> = SLOT_TYPE_LABELS as Record<string, string>;

interface RoundCountLog {
  id: string;
  roundsAdded: number;
  previousCount: number;
  newCount: number;
  sessionNote: string | null;
  loggedAt: string;
}

interface CurrentBuild {
  id: string;
  name: string;
  slotType: string;
  firearm: { id: string; name: string; manufacturer: string; model: string; type: string };
}

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  type: string;
  caliber: string | null;
  purchasePrice: number | null;
  acquisitionDate: string | null;
  notes: string | null;
  imageUrl: string | null;
  roundCount: number;
  roundCountLogs: RoundCountLog[];
  currentBuild: CurrentBuild | null;
  hasBattery: boolean;
  batteryType: string | null;
  batteryChangedAt: string | null;
  batteryIntervalDays: number | null;
}

function computeBatteryDue(changedAt: string | null, intervalDays: number | null) {
  if (!changedAt || !intervalDays) return null;
  const base = new Date(changedAt);
  const nextDue = new Date(base.getTime() + intervalDays * 86400000);
  const daysRemaining = Math.ceil((nextDue.getTime() - Date.now()) / 86400000);
  return { daysRemaining, overdue: daysRemaining <= 0, nextDue };
}

const BARREL_TYPES = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "COMPENSATOR"]);

function roundCountColor(roundCount: number, slotType: string): string {
  const isHighWearPart = BARREL_TYPES.has(slotType);
  const threshold = isHighWearPart ? 5000 : 20000;
  if (roundCount >= threshold) return "text-[#E53935]";
  if (roundCount >= threshold * 0.6) return "text-[#F5A623]";
  return "text-[#00C853]";
}

export default function AccessoryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  // Log rounds form
  const [logOpen, setLogOpen] = useState(false);
  const [logRounds, setLogRounds] = useState("");
  const [logNote, setLogNote] = useState("");
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  // History expand
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocUploader, setShowDocUploader] = useState(false);

  // Battery tracking
  const [showBatterySettings, setShowBatterySettings] = useState(false);
  const [batteryForm, setBatteryForm] = useState({ hasBattery: false, batteryType: "", batteryIntervalDays: "" });
  const [batteryChangedAtInput, setBatteryChangedAtInput] = useState("");
  const [savingBattery, setSavingBattery] = useState(false);
  const [loggingBatteryChange, setLoggingBatteryChange] = useState(false);
  const [batteryError, setBatteryError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/accessories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAccessory(data);
          setLocalImageUrl(data.imageUrl ?? null);
          setBatteryForm({ hasBattery: data.hasBattery ?? false, batteryType: data.batteryType ?? "", batteryIntervalDays: data.batteryIntervalDays?.toString() ?? "" });
          setBatteryChangedAtInput(data.batteryChangedAt ? new Date(data.batteryChangedAt).toISOString().slice(0, 10) : "");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load accessory");
        setLoading(false);
      });

    setDocsLoading(true);
    fetch(`/api/documents?accessoryId=${id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDocuments(data); setDocsLoading(false); })
      .catch(() => setDocsLoading(false));
  }, [id]);

  async function submitLogRounds(e: React.FormEvent) {
    e.preventDefault();
    const parsedRounds = parseInt(logRounds, 10);
    if (isNaN(parsedRounds) || parsedRounds <= 0) return;
    setLogSubmitting(true);
    setLogError(null);

    try {
      const res = await fetch(`/api/accessories/${id}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds: parsedRounds, note: logNote || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLogError(json.error ?? "Failed to log rounds");
      } else {
        setAccessory((prev) =>
          prev
            ? {
                ...prev,
                roundCount: json.accessory.roundCount,
                roundCountLogs: [json.log, ...prev.roundCountLogs],
              }
            : prev
        );
        setLogRounds("");
        setLogNote("");
        setLogOpen(false);
      }
    } catch {
      setLogError("Network error");
    } finally {
      setLogSubmitting(false);
    }
  }

  async function handleSaveBatterySettings(e: React.FormEvent) {
    e.preventDefault();
    setBatteryError(null);
    setSavingBattery(true);
    try {
      const res = await fetch(`/api/accessories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasBattery: batteryForm.hasBattery, batteryType: batteryForm.batteryType || null, batteryIntervalDays: batteryForm.batteryIntervalDays || null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAccessory((prev) => prev ? { ...prev, hasBattery: updated.hasBattery, batteryType: updated.batteryType, batteryIntervalDays: updated.batteryIntervalDays } : prev);
        setShowBatterySettings(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setBatteryError(json.error ?? "Failed to save battery settings.");
      }
    } catch { setBatteryError("Something went wrong. Please try again."); }
    finally { setSavingBattery(false); }
  }

  async function handleLogBatteryChange() {
    setBatteryError(null);
    setLoggingBatteryChange(true);
    try {
      const res = await fetch(`/api/accessories/${id}/battery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changedAt: batteryChangedAtInput || undefined }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAccessory((prev) => prev ? { ...prev, batteryChangedAt: updated.batteryChangedAt } : prev);
        setBatteryChangedAtInput(updated.batteryChangedAt ? new Date(updated.batteryChangedAt).toISOString().slice(0, 10) : "");
      } else {
        const json = await res.json().catch(() => ({}));
        setBatteryError(json.error ?? "Failed to log battery change.");
      }
    } catch { setBatteryError("Something went wrong. Please try again."); }
    finally { setLoggingBatteryChange(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (error || !accessory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-3">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">{error ?? "Accessory not found"}</p>
        <Link href="/accessories" className="text-sm text-[#00C2FF] hover:underline">
          Back to Accessories
        </Link>
      </div>
    );
  }

  const roundColor = roundCountColor(accessory.roundCount, accessory.type);
  const visibleLogs = historyExpanded ? accessory.roundCountLogs : accessory.roundCountLogs.slice(0, 5);

  function handlePhotoChange(url: string | null) {
    setLocalImageUrl(url);
  }

  return (
    <>
    <div className="min-h-full">
      {/* Header with image */}
      <div className="relative h-44 bg-vault-bg overflow-hidden">
        {localImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={localImageUrl}
              alt={accessory.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-bg via-vault-bg/50 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 tactical-grid flex items-center justify-center">
            <Shield className="w-12 h-12 text-vault-border" />
          </div>
        )}
        <button
          onClick={() => setPhotoModalOpen(true)}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs bg-vault-bg/70 backdrop-blur-sm border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/40 px-2.5 py-1.5 rounded-md transition-colors z-10"
        >
          <Camera className="w-3.5 h-3.5" />
          Photo
        </button>

        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <Link
            href="/accessories"
            className="flex items-center gap-1.5 text-[#E8EDF2]/80 hover:text-vault-text text-sm transition-colors bg-vault-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-[#1C2530]/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Accessories
          </Link>
          <Link
            href={`/accessories/${id}/edit`}
            className="flex items-center gap-1.5 text-[#E8EDF2]/80 hover:text-vault-text text-sm transition-colors bg-vault-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-[#1C2530]/60"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono uppercase">
              {SLOT_TYPE_LABELS[accessory.type as keyof typeof SLOT_TYPE_LABELS] ?? accessory.type}
            </span>
            {accessory.caliber && (
              <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono">
                {accessory.caliber}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-vault-text">{accessory.name}</h1>
          <p className="text-sm text-vault-text-muted">{accessory.manufacturer}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Round count - prominent */}
          <div className="col-span-2 sm:col-span-1 bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Round Count</p>
            </div>
            <p className={`text-3xl font-bold font-mono ${roundColor}`}>
              {formatNumber(accessory.roundCount)}
            </p>
            <button
              onClick={() => setLogOpen((o) => !o)}
              className="mt-2 flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Log Rounds
            </button>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Price</p>
            </div>
            <p className="text-sm font-mono text-vault-text">
              {formatCurrency(accessory.purchasePrice)}
            </p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Acquired</p>
            </div>
            <p className="text-sm text-vault-text">{formatDate(accessory.acquisitionDate)}</p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Installed On</p>
            </div>
            {accessory.currentBuild ? (
              <div>
                <Link
                  href={`/vault/${accessory.currentBuild.firearm.id}`}
                  className="text-xs text-[#00C853] hover:underline"
                >
                  {accessory.currentBuild.firearm.name}
                </Link>
                <p className="text-[10px] text-vault-text-faint mt-0.5">
                  {accessory.currentBuild.name}
                </p>
              </div>
            ) : (
              <p className="text-sm text-vault-text-faint">Uninstalled</p>
            )}
          </div>
        </div>

        {/* Log Rounds Inline Form */}
        {logOpen && (
          <div className="bg-vault-surface border border-[#00C2FF]/30 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#00C2FF] mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Log Round Count
            </h3>
            {logError && (
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-4">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{logError}</p>
              </div>
            )}
            <form onSubmit={submitLogRounds} className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">
                  Rounds Fired <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={logRounds}
                  onChange={(e) => setLogRounds(e.target.value)}
                  required
                  placeholder="e.g. 200"
                  className="bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint w-36"
                />
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-muted mb-1.5">
                  Session Note
                </label>
                <input
                  type="text"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="e.g. Sunday range session"
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLogOpen(false)}
                  className="px-3 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {logSubmitting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Log
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes */}
        {accessory.notes && (
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted mb-2">
              Notes
            </h3>
            <p className="text-sm text-vault-text leading-relaxed whitespace-pre-wrap">
              {accessory.notes}
            </p>
          </div>
        )}

        {/* Round Count History */}
        <div>
          <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF] mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Round Count History
          </h2>

          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            {accessory.roundCountLogs.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-vault-text-muted">No round count logs yet.</p>
                <button
                  onClick={() => setLogOpen(true)}
                  className="mt-3 text-xs text-[#00C2FF] hover:underline"
                >
                  Log the first session
                </button>
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-vault-border">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                        Rounds Added
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                        Total After
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden md:table-cell">
                        Note
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vault-border">
                    {visibleLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-vault-surface-2 transition-colors">
                        <td className="px-4 py-3 text-xs text-vault-text-muted">
                          {formatDate(log.loggedAt)}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#00C2FF]">
                          +{formatNumber(log.roundsAdded)}
                        </td>
                        <td className="px-4 py-3 font-mono text-vault-text">
                          {formatNumber(log.newCount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-vault-text-muted hidden md:table-cell">
                          {log.sessionNote ?? <span className="text-vault-text-faint">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {accessory.roundCountLogs.length > 5 && (
                  <button
                    onClick={() => setHistoryExpanded((e) => !e)}
                    className="w-full flex items-center justify-center gap-2 py-3 text-xs text-vault-text-muted hover:text-vault-text border-t border-vault-border transition-colors"
                  >
                    {historyExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Show {accessory.roundCountLogs.length - 5} more
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Current build info */}
        {accessory.currentBuild && (
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted mb-3 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              Currently Installed
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-vault-text">
                  {accessory.currentBuild.firearm.name}
                </p>
                <p className="text-xs text-vault-text-muted mt-0.5">
                  Build: {accessory.currentBuild.name} ·{" "}
                  {SLOT_TYPE_LABELS[accessory.currentBuild.slotType as keyof typeof SLOT_TYPE_LABELS] ?? accessory.currentBuild.slotType} slot
                </p>
              </div>
              <Link
                href={`/builds/${accessory.currentBuild.id}`}
                className="text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
              >
                Open Build
              </Link>
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-vault-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Documents
            </h2>
            <button
              onClick={() => setShowDocUploader((v) => !v)}
              className="flex items-center gap-1 text-xs text-[#00C2FF] hover:underline"
            >
              <Upload className="w-3 h-3" />
              {showDocUploader ? "Cancel" : "Upload"}
            </button>
          </div>

          {showDocUploader && (
            <div className="p-4 border-b border-vault-border">
              <DocumentUploader
                entityType="accessory"
                entityId={id}
                onUploadComplete={(doc) => {
                  setDocuments((prev) => [doc, ...prev]);
                  setShowDocUploader(false);
                }}
                onCancel={() => setShowDocUploader(false)}
              />
            </div>
          )}

          {docsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
            </div>
          ) : documents.length === 0 && !showDocUploader ? (
            <div className="text-center py-6">
              <p className="text-xs text-vault-text-faint">No documents yet. Upload receipts or other files.</p>
            </div>
          ) : (
            <div className="divide-y divide-vault-border">
              {documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-vault-border/20 transition-colors group"
                >
                  <FileText className="w-4 h-4 text-vault-text-faint shrink-0 group-hover:text-[#00C2FF]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-vault-text truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                        doc.type === "NFA_TAX_STAMP"
                          ? "border-[#F5A623]/30 text-[#F5A623]"
                          : doc.type === "RECEIPT"
                          ? "border-[#00C2FF]/30 text-[#00C2FF]"
                          : "border-vault-border text-vault-text-faint"
                      }`}>
                        {doc.type === "NFA_TAX_STAMP" ? "NFA" : doc.type === "RECEIPT" ? "Receipt" : "Doc"}
                      </span>
                      <span className="text-[10px] text-vault-text-faint">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-vault-text-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          )}
        </div>
        {/* Battery Tracking */}
        <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-vault-border">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted flex items-center gap-2">
              Battery
            </h2>
            <button onClick={() => setShowBatterySettings((v) => !v)} className="text-xs text-[#00C2FF] hover:underline flex items-center gap-1">
              <Pencil className="w-3 h-3" />
              {showBatterySettings ? "Cancel" : "Settings"}
            </button>
          </div>

          {showBatterySettings && (
            <form onSubmit={handleSaveBatterySettings} className="p-4 border-b border-vault-border space-y-3">
              <BatterySettingsFields
                hasBattery={batteryForm.hasBattery}
                batteryType={batteryForm.batteryType}
                batteryIntervalDays={batteryForm.batteryIntervalDays}
                onHasBatteryChange={(value) => setBatteryForm((p) => ({ ...p, hasBattery: value }))}
                onBatteryTypeChange={(value) => setBatteryForm((p) => ({ ...p, batteryType: value }))}
                onBatteryIntervalDaysChange={(value) => setBatteryForm((p) => ({ ...p, batteryIntervalDays: value }))}
              />
              <button type="submit" disabled={savingBattery} className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
                {savingBattery ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Save Settings
              </button>
            </form>
          )}

          {batteryError && (
            <p className="text-xs text-[#E53935] bg-[#E53935]/10 border border-[#E53935]/20 rounded-md mx-4 mt-2 px-3 py-2">{batteryError}</p>
          )}

          {!accessory.hasBattery && !showBatterySettings ? (
            <div className="px-4 py-4 text-center">
              <p className="text-xs text-vault-text-faint">Battery tracking not enabled. Click Settings to configure.</p>
            </div>
          ) : accessory.hasBattery && !showBatterySettings ? (
            <div className="p-4 space-y-3">
              {accessory.batteryType && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vault-text-faint">Type</span>
                  <span className="text-sm font-mono text-vault-text">{accessory.batteryType}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-vault-text-faint">Last Changed</span>
                <span className="text-sm text-vault-text">{accessory.batteryChangedAt ? new Date(accessory.batteryChangedAt).toLocaleDateString() : "Never"}</span>
              </div>
              {accessory.batteryIntervalDays && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vault-text-faint">Interval</span>
                  <span className="text-sm text-vault-text">Every {accessory.batteryIntervalDays} days</span>
                </div>
              )}
              {(() => {
                const due = computeBatteryDue(accessory.batteryChangedAt, accessory.batteryIntervalDays);
                if (!due) return null;
                const dueColor = due.overdue ? "text-red-400" : due.daysRemaining <= 30 ? "text-orange-400" : "text-[#00C853]";
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-vault-text-faint">Next Due</span>
                    <span className={`text-sm font-semibold ${dueColor}`}>
                      {due.overdue ? `Overdue by ${Math.abs(due.daysRemaining)} days` : `In ${due.daysRemaining} days`}
                    </span>
                  </div>
                );
              })()}
              <div>
                <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Last Changed Date</label>
                <input
                  type="date"
                  value={batteryChangedAtInput}
                  onChange={(e) => setBatteryChangedAtInput(e.target.value)}
                  className="w-full bg-vault-bg border border-vault-border rounded px-2 py-1.5 text-sm text-vault-text"
                />
              </div>
              <button onClick={handleLogBatteryChange} disabled={loggingBatteryChange} className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 px-3 py-2 rounded transition-colors disabled:opacity-50">
                {loggingBatteryChange ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Save Last Changed Date
              </button>
            </div>
          ) : null}
        </div>

      </div>
    </div>

    {/* Photo upload modal */}
    {photoModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(5,7,9,0.85)" }}>
        <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold text-vault-text">Photos</h2>
            </div>
            <button onClick={() => setPhotoModalOpen(false)} className="text-vault-text-faint hover:text-vault-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <PhotoGallery
              entityType="accessory"
              entityId={id}
              onPrimaryChange={handlePhotoChange}
            />
          </div>
          <div className="px-5 pb-4 flex justify-end">
            <button
              onClick={() => setPhotoModalOpen(false)}
              className="text-sm text-vault-text-muted hover:text-vault-text border border-vault-border px-4 py-1.5 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
