"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
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
} from "lucide-react";

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

const SLOT_TYPE_LABELS: Record<string, string> = {
  MUZZLE: "Muzzle",
  BARREL: "Barrel",
  HANDGUARD: "Handguard",
  STOCK: "Stock",
  BUFFER_TUBE: "Buffer Tube",
  GRIP: "Grip",
  OPTIC: "Optic",
  OPTIC_MOUNT: "Optic Mount",
  UNDERBARREL: "Underbarrel",
  MAGAZINE: "Magazine",
  LIGHT: "Light",
  LASER: "Laser",
  CHARGING_HANDLE: "Charging Handle",
  TRIGGER: "Trigger",
  LOWER_RECEIVER: "Lower Receiver",
  UPPER_RECEIVER: "Upper Receiver",
  SLIDE: "Slide",
  FRAME: "Frame",
  SUPPRESSOR: "Suppressor",
  BIPOD: "Bipod",
  SLING: "Sling",
  COMPENSATOR: "Compensator",
  MAGWELL: "Magwell",
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

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FirearmDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"range" | "maintenance">("range");

  const [rangeSessions, setRangeSessions] = useState<RangeSession[]>([]);
  const [rangeLoading, setRangeLoading] = useState(true);

  const [maintenanceNotes, setMaintenanceNotes] = useState<MaintenanceNote[]>([]);
  const [maintLoading, setMaintLoading] = useState(true);

  // Add maintenance note form
  const [addingNote, setAddingNote] = useState(false);
  const [noteType, setNoteType] = useState("Cleaning");
  const [noteDescription, setNoteDescription] = useState("");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/firearms/${id}`)
      .then((r) => r.json())
      .then((data) => { setFirearm(data); setLoading(false); })
      .catch(() => setLoading(false));

    fetch(`/api/range-sessions?firearmId=${id}&limit=10`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRangeSessions(data); setRangeLoading(false); })
      .catch(() => setRangeLoading(false));

    fetch(`/api/maintenance-notes?firearmId=${id}&limit=10`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMaintenanceNotes(data); setMaintLoading(false); })
      .catch(() => setMaintLoading(false));
  }, [id]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteDescription.trim()) return;
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
      }
    } catch { /* ignore */ }
    finally { setSavingNote(false); }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingNote(noteId);
    try {
      await fetch(`/api/maintenance-notes/${noteId}`, { method: "DELETE" });
      setMaintenanceNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch { /* ignore */ }
    finally { setDeletingNote(null); }
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

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Hero Banner */}
        <div className="relative h-56 bg-vault-bg overflow-hidden">
          {firearm.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={firearm.imageUrl}
                alt={firearm.name}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-vault-bg via-vault-bg/60 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 tactical-grid flex items-center justify-center">
              <Shield className="w-16 h-16 text-vault-border" />
            </div>
          )}

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
                                  {SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}
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
            Maintenance
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
            <div className="p-4">
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
        )}
      </div>
    </div>
  );
}
