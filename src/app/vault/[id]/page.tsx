"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { SLOT_TYPE_LABELS } from "@/lib/types";
import {
  ArrowLeft,
  Edit,
  Shield,
  Plus,
  Layers,
  CheckCircle2,
  Settings2,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  TrendingUp,
  Target,
  Wrench,
  Trash2,
  Loader2,
  MapPin,
  Clock,
  Camera,
  X,
  Upload,
  ExternalLink,
} from "lucide-react";
import ImagePicker from "@/components/shared/ImagePicker";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";

const FIREARM_TYPE_LABELS: Record<string, string> = {
  PISTOL: "Pistol",
  RIFLE: "Rifle",
  SHOTGUN: "Shotgun",
  SMG: "SMG",
  PCC: "PCC",
  REVOLVER: "Revolver",
  BOLT_ACTION: "Bolt Action",
  LEVER_ACTION: "Lever Action",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  PISTOL: "border-[#00C2FF]/40 text-[#00C2FF]",
  RIFLE: "border-[#00C853]/40 text-[#00C853]",
  SHOTGUN: "border-[#F5A623]/40 text-[#F5A623]",
  SMG: "border-[#9C27B0]/40 text-[#CE93D8]",
  PCC: "border-[#00BCD4]/40 text-[#00BCD4]",
  REVOLVER: "border-[#E53935]/40 text-[#EF9A9A]",
  BOLT_ACTION: "border-[#8B9DB0]/40 text-vault-text-muted",
  LEVER_ACTION: "border-[#FF7043]/40 text-[#FF7043]",
};


const MAINTENANCE_TYPES = [
  "Cleaning",
  "Inspection",
  "Repair",
  "Parts Replacement",
  "Lubrication",
  "Function Check",
  "Professional Service",
  "Other",
];

interface Accessory {
  id: string;
  name: string;
}

interface BuildSlot {
  id: string;
  slotType: string;
  accessoryId: string | null;
  accessory: Accessory | null;
}

interface Build {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  slots: BuildSlot[];
}

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  caliber: string;
  serialNumber: string | null;
  type: string;
  acquisitionDate: string | null;
  purchasePrice: number | null;
  currentValue: number | null;
  notes: string | null;
  imageUrl: string | null;
  builds: Build[];
}

interface RangeSession {
  id: string;
  date: string;
  roundsFired: number;
  rangeName: string | null;
  rangeLocation: string | null;
  notes: string | null;
  build: { id: string; name: string } | null;
}

interface MaintenanceNote {
  id: string;
  date: string;
  type: string;
  description: string;
  mileage: number | null;
}

interface MaintenanceSchedule {
  id: string;
  taskName: string;
  intervalType: "ROUNDS" | "DAYS";
  intervalValue: number;
  lastCompletedAt: string | null;
  lastRoundCount: number | null;
  notes: string | null;
}

function computeDue(schedule: MaintenanceSchedule, currentRoundCount: number) {
  if (schedule.intervalType === "ROUNDS") {
    const base = schedule.lastRoundCount ?? 0;
    const nextDueAt = base + schedule.intervalValue;
    const remaining = nextDueAt - currentRoundCount;
    return { remaining, unit: "rounds" as const, overdue: remaining <= 0 };
  } else {
    const base = schedule.lastCompletedAt ? new Date(schedule.lastCompletedAt) : null;
    if (!base) {
      return { remaining: 0, unit: "days" as const, overdue: false, noHistory: true };
    }
    const nextDueAt = new Date(base.getTime() + schedule.intervalValue * 86400000);
    const daysRemaining = Math.ceil((nextDueAt.getTime() - Date.now()) / 86400000);
    return { remaining: daysRemaining, unit: "days" as const, overdue: daysRemaining <= 0 };
  }
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FirearmDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"range" | "maintenance" | "documents">("range");
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);

  const [rangeSessions, setRangeSessions] = useState<RangeSession[]>([]);
  const [rangeLoading, setRangeLoading] = useState(true);

  const [maintenanceNotes, setMaintenanceNotes] = useState<MaintenanceNote[]>([]);
  const [maintLoading, setMaintLoading] = useState(true);

  // Documents
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showDocUploader, setShowDocUploader] = useState(false);

  // Maintenance schedules
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [currentRoundCount, setCurrentRoundCount] = useState(0);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ taskName: "", intervalType: "DAYS" as "ROUNDS" | "DAYS", intervalValue: "", notes: "" });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [completingSchedule, setCompletingSchedule] = useState<string | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<string | null>(null);

  // Add maintenance note form
  const [addingNote, setAddingNote] = useState(false);
  const [noteType, setNoteType] = useState("Cleaning");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/firearms/${id}`)
      .then((r) => r.json())
      .then((data) => { setFirearm(data); setLocalImageUrl(data.imageUrl ?? null); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`/api/range-sessions?firearmId=${id}&limit=10`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRangeSessions(data); setRangeLoading(false); })
      .catch(() => setRangeLoading(false));

    fetch(`/api/maintenance-notes?firearmId=${id}&limit=10`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMaintenanceNotes(data); setMaintLoading(false); })
      .catch(() => setMaintLoading(false));

    setDocsLoading(true);
    fetch(`/api/documents?firearmId=${id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDocuments(data); setDocsLoading(false); })
      .catch(() => setDocsLoading(false));

    fetch(`/api/maintenance-schedules?firearmId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.schedules) setSchedules(data.schedules);
        if (data.currentRoundCount != null) setCurrentRoundCount(data.currentRoundCount);
        setSchedulesLoading(false);
      })
      .catch(() => setSchedulesLoading(false));
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDescription.trim()) return;
    setActionError(null);
    setSavingNote(true);
    try {
      const res = await fetch("/api/maintenance-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firearmId: id, type: noteType, description: noteDescription, date: noteDate }),
      });
      if (res.ok) {
        const created = await res.json();
        setMaintenanceNotes((prev) => [created, ...prev]);
        setNoteDescription("");
        setNoteType("Cleaning");
        setNoteDate(new Date().toISOString().split("T")[0]);
        setAddingNote(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setActionError(json.error ?? "Failed to add note.");
      }
    } catch { setActionError("Something went wrong. Please try again."); }
    finally { setSavingNote(false); }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingNote(noteId);
    setActionError(null);
    try {
      await fetch(`/api/maintenance-notes/${noteId}`, { method: "DELETE" });
      setMaintenanceNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch { setActionError("Failed to delete note. Please try again."); }
    finally { setDeletingNote(null); }
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!scheduleForm.taskName.trim() || !scheduleForm.intervalValue) return;
    setActionError(null);
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/maintenance-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firearmId: id, taskName: scheduleForm.taskName.trim(), intervalType: scheduleForm.intervalType, intervalValue: parseInt(scheduleForm.intervalValue), notes: scheduleForm.notes.trim() || null }),
      });
      if (res.ok) {
        const created = await res.json();
        setSchedules((prev) => [...prev, created]);
        setScheduleForm({ taskName: "", intervalType: "DAYS", intervalValue: "", notes: "" });
        setShowAddSchedule(false);
      } else {
        const json = await res.json().catch(() => ({}));
        setActionError(json.error ?? "Failed to add schedule.");
      }
    } catch { setActionError("Something went wrong. Please try again."); }
    finally { setSavingSchedule(false); }
  }

  async function handleCompleteSchedule(scheduleId: string) {
    setCompletingSchedule(scheduleId);
    setActionError(null);
    try {
      const res = await fetch(`/api/maintenance-schedules/${scheduleId}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const { schedule } = await res.json();
        setSchedules((prev) => prev.map((s) => s.id === scheduleId ? schedule : s));
      } else {
        const json = await res.json().catch(() => ({}));
        setActionError(json.error ?? "Failed to mark complete.");
      }
    } catch { setActionError("Something went wrong. Please try again."); }
    finally { setCompletingSchedule(null); }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    setDeletingSchedule(scheduleId);
    setActionError(null);
    try {
      await fetch(`/api/maintenance-schedules/${scheduleId}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch { setActionError("Failed to delete schedule. Please try again."); }
    finally { setDeletingSchedule(null); }
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (!firearm) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-vault-text-muted">Firearm not found.</p>
      </div>
    );
  }

  const gainLoss =
    firearm.currentValue != null && firearm.purchasePrice != null
      ? firearm.currentValue - firearm.purchasePrice
      : null;

  const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? "border-vault-border text-vault-text-muted";
  const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;

  async function handlePhotoChange(url: string | null, source: string | null) {
    const res = await fetch(`/api/firearms/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url, imageSource: source }),
    });
    if (res.ok) {
      setLocalImageUrl(url);
      setPhotoModalOpen(false);
    }
  }

  return (
    <>
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Hero Banner */}
        <div className="relative h-56 bg-vault-bg overflow-hidden">
          {localImageUrl ? (
            <>
              <Image
                src={localImageUrl}
                alt={firearm.name}
                fill
                sizes="100vw"
                priority
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vault-bg via-vault-bg/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 tactical-grid flex items-center justify-center">
              <Shield className="w-16 h-16 text-vault-border" />
            </div>
          )}
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs bg-vault-bg/70 backdrop-blur-sm border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/40 px-2.5 py-1.5 rounded-md transition-colors z-10"
          >
            <Camera className="w-3.5 h-3.5" />
            Photo
          </button>

          {/* Nav bar over image */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
            <Link
              href="/vault"
              className="flex items-center gap-1.5 text-[#E8EDF2]/80 hover:text-vault-text text-sm transition-colors bg-vault-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-[#1C2530]/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Vault
            </Link>
            <Link
              href={`/vault/${id}/edit`}
              className="flex items-center gap-1.5 text-sm bg-vault-bg/60 backdrop-blur-sm border border-[#1C2530]/60 text-vault-text-muted hover:text-vault-text px-3 py-1.5 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>

          {/* Name + badges over image */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {firearm.type && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeBadge}`}>
                      {typeLabel}
                    </span>
                  )}
                  {firearm.caliber && (
                    <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono">
                      {firearm.caliber}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-vault-text leading-tight">{firearm.name}</h1>
                {(firearm.manufacturer || firearm.model) && (
                  <p className="text-sm text-vault-text-muted mt-0.5">
                    {[firearm.manufacturer, firearm.model].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3.5 h-3.5 text-vault-text-faint" />
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Serial</p>
              </div>
              <p className="text-sm font-mono text-vault-text">{firearm.serialNumber ?? "—"}</p>
            </div>

            <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-3.5 h-3.5 text-vault-text-faint" />
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Acquired</p>
              </div>
              <p className="text-sm text-vault-text">{formatDate(firearm.acquisitionDate) || "—"}</p>
            </div>

            <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-vault-text-faint" />
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Paid</p>
              </div>
              <p className="text-sm font-mono text-vault-text">
                {formatCurrency(firearm.purchasePrice) || "—"}
              </p>
            </div>

            <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-vault-text-faint" />
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Value</p>
              </div>
              <p className="text-sm font-mono text-vault-text">
                {formatCurrency(firearm.currentValue) || "—"}
              </p>
              {gainLoss != null && (
                <p className={`text-[10px] mt-0.5 font-mono ${gainLoss >= 0 ? "text-[#00C853]" : "text-[#E53935]"}`}>
                  {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
                </p>
              )}
            </div>

            <div className="bg-vault-surface border border-vault-border rounded-lg p-4 sm:col-span-1 col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-vault-text-faint" />
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Builds</p>
              </div>
              <p className="text-sm font-mono text-vault-text">{firearm.builds.length}</p>
            </div>
          </div>

          {/* Notes */}
          {firearm.notes && (
            <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-vault-text-faint" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted">Notes</h3>
              </div>
              <p className="text-sm text-vault-text leading-relaxed whitespace-pre-wrap">{firearm.notes}</p>
            </div>
          )}

          {/* Builds Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00C2FF]" />
                <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF]">
                  Builds
                </h2>
              </div>
              <Link
                href={`/vault/${id}/builds/new`}
                className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                New Build
              </Link>
            </div>

            {firearm.builds.length === 0 ? (
              <div className="bg-vault-surface border border-vault-border rounded-lg p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-6 h-6 text-[#00C2FF]" />
                </div>
                <h3 className="text-sm font-semibold text-vault-text mb-2">No builds yet</h3>
                <p className="text-xs text-vault-text-muted mb-4 max-w-xs mx-auto">
                  Create a build to start configuring accessories and attachments for this firearm.
                </p>
                <Link
                  href={`/vault/${id}/builds/new`}
                  className="inline-flex items-center gap-2 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Create First Build
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {firearm.builds.map((build) => {
                  const filledSlots = build.slots.filter((s) => s.accessoryId);
                  return (
                    <div
                      key={build.id}
                      className={`bg-vault-surface border rounded-lg p-4 ${
                        build.isActive
                          ? "border-[#00C853]/40"
                          : "border-vault-border hover:border-vault-text-muted/30"
                      } transition-colors`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-vault-text truncate">
                              {build.name}
                            </h3>
                            {build.isActive && (
                              <span className="flex items-center gap-1 text-[10px] text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Active
                              </span>
                            )}
                          </div>
                          {build.description && (
                            <p className="text-xs text-vault-text-muted truncate">{build.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-vault-text-faint mb-2">
                          {filledSlots.length} of {build.slots.length} slot{build.slots.length !== 1 ? "s" : ""} filled
                        </p>
                        {filledSlots.length > 0 && (
                          <div className="space-y-1">
                            {filledSlots.slice(0, 4).map((slot) => (
                              <div key={slot.id} className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-vault-text-faint w-24 shrink-0">
                                  {SLOT_TYPE_LABELS[slot.slotType as keyof typeof SLOT_TYPE_LABELS] ?? slot.slotType}
                                </span>
                                <span className="text-xs text-vault-text-muted truncate">
                                  {slot.accessory?.name ?? "—"}
                                </span>
                              </div>
                            ))}
                            {filledSlots.length > 4 && (
                              <p className="text-[10px] text-vault-text-faint">
                                +{filledSlots.length - 4} more
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/vault/${id}/builds/${build.id}`}
                        className="flex items-center justify-center gap-2 w-full text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-2 rounded transition-colors"
                      >
                        <Settings2 className="w-3 h-3" />
                        Open Configurator
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="lg:w-80 lg:border-l border-t lg:border-t-0 border-vault-border bg-vault-surface flex flex-col">
        {/* Sidebar tabs */}
        <div className="flex border-b border-vault-border">
          <button
            onClick={() => setSidebarTab("range")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              sidebarTab === "range"
                ? "text-[#00C2FF] border-b-2 border-[#00C2FF]"
                : "text-vault-text-faint hover:text-vault-text-muted"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            Range
          </button>
          <button
            onClick={() => setSidebarTab("maintenance")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              sidebarTab === "maintenance"
                ? "text-[#00C2FF] border-b-2 border-[#00C2FF]"
                : "text-vault-text-faint hover:text-vault-text-muted"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Maint.
          </button>
          <button
            onClick={() => setSidebarTab("documents")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
              sidebarTab === "documents"
                ? "text-[#00C2FF] border-b-2 border-[#00C2FF]"
                : "text-vault-text-faint hover:text-vault-text-muted"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Docs
          </button>
        </div>

        {/* Range Sessions Tab */}
        {sidebarTab === "range" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Recent Sessions</p>
                <Link href="/range" className="text-[10px] text-[#00C2FF] hover:underline">+ Log</Link>
              </div>

              {rangeLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                </div>
              ) : rangeSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-vault-border mx-auto mb-2" />
                  <p className="text-xs text-vault-text-faint">No range sessions yet</p>
                  <Link href="/range" className="text-[10px] text-[#00C2FF] hover:underline mt-1 inline-block">
                    Log first session
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {rangeSessions.map((session) => (
                    <div key={session.id} className="bg-vault-bg border border-vault-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-[#00C2FF]">
                          {formatNumber(session.roundsFired)} rds
                        </span>
                        <span className="text-[10px] text-vault-text-faint">{formatSessionDate(session.date)}</span>
                      </div>
                      {session.build && (
                        <p className="text-[10px] text-vault-text-muted font-mono border border-vault-border rounded px-1.5 py-0.5 inline-block mb-1">
                          {session.build.name}
                        </p>
                      )}
                      {session.rangeName && (
                        <div className="flex items-center gap-1 text-[10px] text-vault-text-faint">
                          <MapPin className="w-2.5 h-2.5" />
                          <span>{session.rangeName}{session.rangeLocation ? ` · ${session.rangeLocation}` : ""}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <Link href={`/range/history`} className="block text-center text-[10px] text-vault-text-faint hover:text-[#00C2FF] pt-1 transition-colors">
                    View all sessions →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {sidebarTab === "maintenance" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">

              {actionError && (
                <p className="text-xs text-[#E53935] bg-[#E53935]/10 border border-[#E53935]/20 rounded-md px-3 py-2">{actionError}</p>
              )}

              {/* Maintenance Schedules */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Service Schedules</p>
                  <button onClick={() => setShowAddSchedule((v) => !v)} className="text-[10px] text-[#00C2FF] hover:underline">
                    {showAddSchedule ? "Cancel" : "+ Add"}
                  </button>
                </div>

                {showAddSchedule && (
                  <form onSubmit={handleAddSchedule} className="bg-vault-bg border border-vault-border rounded-lg p-3 mb-3 space-y-2">
                    <div>
                      <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Task Name</label>
                      <input type="text" value={scheduleForm.taskName} onChange={(e) => setScheduleForm((p) => ({ ...p, taskName: e.target.value }))} placeholder="e.g. Full Clean" className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text placeholder:text-vault-text-faint" required />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Interval Type</label>
                      <div className="flex gap-2">
                        {(["DAYS", "ROUNDS"] as const).map((v) => (
                          <button key={v} type="button" onClick={() => setScheduleForm((p) => ({ ...p, intervalType: v }))} className={`flex-1 py-1 rounded text-[10px] font-medium border transition-colors ${scheduleForm.intervalType === v ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]" : "border-vault-border text-vault-text-muted hover:bg-vault-border"}`}>
                            {v === "DAYS" ? "By Days" : "By Rounds"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Every {scheduleForm.intervalType === "DAYS" ? "N Days" : "N Rounds"}</label>
                      <input type="number" min="1" value={scheduleForm.intervalValue} onChange={(e) => setScheduleForm((p) => ({ ...p, intervalValue: e.target.value }))} placeholder={scheduleForm.intervalType === "DAYS" ? "e.g. 90" : "e.g. 500"} className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text placeholder:text-vault-text-faint" required />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Notes (optional)</label>
                      <input type="text" value={scheduleForm.notes} onChange={(e) => setScheduleForm((p) => ({ ...p, notes: e.target.value }))} placeholder="e.g. Use CLP lubricant" className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text placeholder:text-vault-text-faint" />
                    </div>
                    <button type="submit" disabled={savingSchedule || !scheduleForm.taskName.trim() || !scheduleForm.intervalValue} className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50">
                      {savingSchedule ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Save Schedule
                    </button>
                  </form>
                )}

                {schedulesLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
                ) : schedules.length === 0 ? (
                  <p className="text-[10px] text-vault-text-faint text-center py-3">No schedules yet. Add one to track service intervals.</p>
                ) : (
                  <div className="space-y-2">
                    {schedules.map((s) => {
                      const due = computeDue(s, currentRoundCount);
                      const dueColor = due.overdue ? "text-red-400" : due.remaining <= (s.intervalType === "DAYS" ? 30 : s.intervalValue * 0.2) ? "text-orange-400" : "text-[#00C853]";
                      return (
                        <div key={s.id} className="bg-vault-bg border border-vault-border rounded-lg p-3">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-vault-text truncate">{s.taskName}</p>
                              <p className="text-[10px] text-vault-text-faint">Every {s.intervalValue} {s.intervalType === "DAYS" ? "days" : "rounds"}</p>
                            </div>
                            <button onClick={() => handleDeleteSchedule(s.id)} disabled={deletingSchedule === s.id} className="shrink-0 w-5 h-5 flex items-center justify-center text-vault-text-faint hover:text-red-400 rounded transition-colors disabled:opacity-50">
                              {deletingSchedule === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              {(due as { noHistory?: boolean }).noHistory ? (
                                <p className="text-[10px] text-vault-text-faint">Never completed</p>
                              ) : (
                                <p className={`text-[10px] font-semibold ${dueColor}`}>
                                  {due.overdue ? `Overdue by ${Math.abs(due.remaining)} ${due.unit}` : `Due in ${due.remaining} ${due.unit}`}
                                </p>
                              )}
                              {s.lastCompletedAt && (
                                <p className="text-[10px] text-vault-text-faint">Last: {new Date(s.lastCompletedAt).toLocaleDateString()}</p>
                              )}
                            </div>
                            <button onClick={() => handleCompleteSchedule(s.id)} disabled={completingSchedule === s.id} className="flex items-center gap-1 text-[10px] bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 px-2 py-1 rounded transition-colors disabled:opacity-50">
                              {completingSchedule === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                              Done
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-vault-border" />

              {/* Maintenance Log */}
              <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Maintenance Log</p>
                <button
                  onClick={() => setAddingNote((v) => !v)}
                  className="text-[10px] text-[#00C2FF] hover:underline"
                >
                  {addingNote ? "Cancel" : "+ Add"}
                </button>
              </div>

              {addingNote && (
                <form onSubmit={handleAddNote} className="bg-vault-bg border border-vault-border rounded-lg p-3 mb-3 space-y-2">
                  <div>
                    <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Type</label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text"
                    >
                      {MAINTENANCE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Date</label>
                    <input
                      type="date"
                      value={noteDate}
                      onChange={(e) => setNoteDate(e.target.value)}
                      className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-vault-text-faint block mb-1">Description</label>
                    <textarea
                      value={noteDescription}
                      onChange={(e) => setNoteDescription(e.target.value)}
                      placeholder="Describe the maintenance performed..."
                      rows={3}
                      className="w-full bg-vault-surface border border-vault-border rounded px-2 py-1 text-xs text-vault-text resize-none placeholder:text-vault-text-faint"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingNote || !noteDescription.trim()}
                    className="w-full flex items-center justify-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Save Note
                  </button>
                </form>
              )}

              {maintLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                </div>
              ) : maintenanceNotes.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-8 h-8 text-vault-border mx-auto mb-2" />
                  <p className="text-xs text-vault-text-faint">No maintenance records yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {maintenanceNotes.map((note) => (
                    <div key={note.id} className="bg-vault-bg border border-vault-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono text-[#00C2FF] border border-[#00C2FF]/30 px-1.5 py-0.5 rounded">
                              {note.type}
                            </span>
                            <span className="text-[10px] text-vault-text-faint">{formatSessionDate(note.date)}</span>
                          </div>
                          <p className="text-xs text-vault-text-muted line-clamp-2">{note.description}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNote === note.id}
                          className="shrink-0 w-6 h-6 flex items-center justify-center text-vault-text-faint hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors disabled:opacity-50"
                        >
                          {deletingNote === note.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {sidebarTab === "documents" && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Documents</p>
                <button
                  onClick={() => setShowDocUploader((v) => !v)}
                  className="text-[10px] text-[#00C2FF] hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  {showDocUploader ? "Cancel" : "Upload"}
                </button>
              </div>

              {showDocUploader && (
                <div className="mb-4 bg-vault-bg border border-vault-border rounded-lg p-3">
                  <DocumentUploader
                    entityType="firearm"
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
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
                </div>
              ) : documents.length === 0 && !showDocUploader ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-vault-border mx-auto mb-2" />
                  <p className="text-xs text-vault-text-faint">No documents yet</p>
                  <p className="text-[10px] text-vault-text-faint mt-1">Upload receipts or other documents</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 bg-vault-bg border border-vault-border rounded-lg p-3 hover:border-[#00C2FF]/30 transition-colors group"
                    >
                      <FileText className="w-4 h-4 text-vault-text-faint shrink-0 mt-0.5 group-hover:text-[#00C2FF]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-vault-text truncate">{doc.name}</p>
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
                      <ExternalLink className="w-3 h-3 text-vault-text-faint shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
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
              entityType="firearm"
              entityId={id}
              currentUrl={localImageUrl}
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
