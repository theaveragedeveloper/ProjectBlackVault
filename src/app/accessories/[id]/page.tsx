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
} from "lucide-react";
import ImagePicker from "@/components/shared/ImagePicker";


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

  useEffect(() => {
    fetch(`/api/accessories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setAccessory(data);
          setLocalImageUrl(data.imageUrl ?? null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load accessory");
        setLoading(false);
      });
  }, [id]);

  async function submitLogRounds(e: React.FormEvent) {
    e.preventDefault();
    if (!logRounds || parseInt(logRounds) <= 0) return;
    setLogSubmitting(true);
    setLogError(null);

    try {
      const res = await fetch(`/api/accessories/${id}/rounds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rounds: parseInt(logRounds), note: logNote || undefined }),
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

  async function handlePhotoChange(url: string | null, source: string | null) {
    await fetch(`/api/accessories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url, imageSource: source }),
    });
    setLocalImageUrl(url);
    setPhotoModalOpen(false);
  }

  return (
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
              {SLOT_TYPE_LABELS[accessory.type] ?? accessory.type}
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
                  {SLOT_TYPE_LABELS[accessory.currentBuild.slotType] ?? accessory.currentBuild.slotType} slot
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
      </div>
    </div>

    {/* Photo upload modal */}
    {photoModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(5,7,9,0.85)" }}>
        <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold text-vault-text">Update Photo</h2>
            </div>
            <button onClick={() => setPhotoModalOpen(false)} className="text-vault-text-faint hover:text-vault-text transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            <ImagePicker
              entityType="accessory"
              entityId={id}
              currentUrl={localImageUrl}
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>
    )}
  );
}
