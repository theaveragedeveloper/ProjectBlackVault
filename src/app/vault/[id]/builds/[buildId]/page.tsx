"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ArrowLeft,
  X,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  Shield,
  Crosshair,
  ChevronRight,
  Save,
} from "lucide-react";
import {
  SLOTS_BY_FIREARM_TYPE,
  SLOT_TYPE_LABELS,
  SLOT_CATEGORIES,
  BUILD_STATUSES,
  FirearmType,
  SlotType,
} from "@/lib/types";
import { SLOT_POSITIONS } from "@/lib/configurator/slot-positions";
import { SLOT_ICONS } from "@/lib/configurator/slot-icons";
import { useToast } from "@/lib/store";
import { BuildStatusBadge } from "@/components/builds/BuildStatusBadge";
import { formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  type: string;
  caliber: string | null;
  roundCount: number;
  purchasePrice: number | null;
  imageUrl: string | null;
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
  status: string;
  notes: string | null;
  firearmId: string;
  slots: BuildSlot[];
  firearm: {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    type: string;
    caliber: string;
    imageUrl: string | null;
  };
}

// ─── Accessory Browser Modal ───────────────────────────────────

interface AccessoryBrowserModalProps {
  slotType: SlotType;
  buildId: string;
  onClose: () => void;
  onAssigned: () => void;
}

function AccessoryBrowserModal({
  slotType,
  buildId,
  onClose,
  onAssigned,
}: AccessoryBrowserModalProps) {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [view, setView] = useState<"browse" | "create">("browse");
  const [form, setForm] = useState({ name: "", manufacturer: "", model: "", caliber: "", purchasePrice: "", imageUrl: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/accessories?type=${encodeURIComponent(slotType)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccessories(data);
        } else {
          setError(data.error ?? "Failed to load accessories");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error");
        setLoading(false);
      });
  }, [slotType]);

  const filtered = accessories.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.manufacturer.toLowerCase().includes(q) ||
      (a.model ?? "").toLowerCase().includes(q)
    );
  });

  async function assignAccessory(accessoryId: string) {
    setAssigning(accessoryId);
    setAssignError(null);
    try {
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAssignError(json.error ?? "Failed to assign accessory");
      } else {
        onAssigned();
        onClose();
      }
    } catch {
      setAssignError("Network error");
    } finally {
      setAssigning(null);
    }
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.manufacturer.trim()) {
      setCreateError("Name and Manufacturer are required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const createRes = await fetch("/api/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          manufacturer: form.manufacturer.trim(),
          model: form.model.trim() || undefined,
          type: slotType,
          caliber: form.caliber.trim() || undefined,
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
          imageUrl: form.imageUrl.trim() || undefined,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        setCreateError(created.error ?? "Failed to create accessory");
        return;
      }
      const assignRes = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId: created.id }),
      });
      if (!assignRes.ok) {
        const j = await assignRes.json();
        setCreateError(j.error ?? "Created but failed to assign");
        return;
      }
      onAssigned();
      onClose();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  }

  const slotIconConfig = SLOT_ICONS[slotType as SlotType];
  const SlotIcon = slotIconConfig?.icon ?? Shield;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--vault-overlay)" }}
    >
      <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}18` }}
            >
              <SlotIcon
                className="w-4 h-4"
                style={{ color: slotIconConfig?.color ?? "#8B9DB0" }}
              />
            </div>
            <div>
              <p className="text-xs text-vault-text-faint uppercase tracking-widest font-mono">
                Assign Attachment
              </p>
              <h2 className="text-sm font-semibold text-vault-text">
                {SLOT_TYPE_LABELS[slotType]}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-vault-text-muted hover:text-vault-text hover:bg-vault-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-vault-border shrink-0">
          <button
            onClick={() => setView("browse")}
            className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              view === "browse"
                ? "text-[#00C2FF] border-b-2 border-[#00C2FF]"
                : "text-vault-text-faint hover:text-vault-text-muted"
            }`}
          >
            Browse Library
          </button>
          <button
            onClick={() => setView("create")}
            className={`flex-1 py-2.5 text-xs font-medium tracking-wide transition-colors ${
              view === "create"
                ? "text-[#00C2FF] border-b-2 border-[#00C2FF]"
                : "text-vault-text-faint hover:text-vault-text-muted"
            }`}
          >
            + Create New
          </button>
        </div>

        {/* Search — only show in browse view */}
        {view === "browse" && (
          <div className="px-5 py-3 border-b border-vault-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${SLOT_TYPE_LABELS[slotType]} accessories...`}
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                autoFocus
              />
            </div>
          </div>
        )}

        {view === "browse" && assignError && (
          <div className="mx-5 mt-3 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{assignError}</p>
          </div>
        )}

        {/* Content */}
        {view === "browse" ? (
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-[#00C2FF] animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="w-8 h-8 text-[#E53935]" />
                <p className="text-sm text-[#E53935]">{error}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full bg-vault-border flex items-center justify-center">
                  <Crosshair className="w-6 h-6 text-vault-text-faint" />
                </div>
                <p className="text-sm text-vault-text-muted">
                  {search
                    ? "No accessories match your search"
                    : `No ${SLOT_TYPE_LABELS[slotType]} accessories in your collection`}
                </p>
                {!search && (
                  <button
                    onClick={() => setView("create")}
                    className="text-xs text-[#00C2FF] hover:underline"
                  >
                    Create one now
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((acc) => {
                  const isAssigning = assigning === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => assignAccessory(acc.id)}
                      disabled={!!assigning}
                      className="flex items-center gap-3 text-left w-full bg-vault-bg border border-vault-border hover:border-[#00C2FF]/40 hover:bg-[#00C2FF]/5 rounded-lg p-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed group"
                    >
                      <div className="w-14 h-14 shrink-0 rounded-md overflow-hidden bg-vault-surface border border-vault-border flex items-center justify-center">
                        {acc.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={acc.imageUrl}
                            alt={acc.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <SlotIcon
                            className="w-6 h-6"
                            style={{ color: slotIconConfig?.color ?? "#4A5A6B" }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-vault-text truncate group-hover:text-[#00C2FF] transition-colors">
                          {acc.name}
                        </p>
                        <p className="text-xs text-vault-text-muted truncate">{acc.manufacturer}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {acc.caliber && (
                            <span className="text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                              {acc.caliber}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[#F5A623]">
                            {acc.roundCount.toLocaleString()} rds
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isAssigning ? (
                          <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 text-vault-text-faint group-hover:text-[#00C2FF] transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {createError && (
              <div className="mb-4 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{createError}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Type</label>
                <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text-muted font-mono">
                  {SLOT_TYPE_LABELS[slotType]}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                  placeholder="e.g. Trijicon ACOG 4x32" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Manufacturer *</label>
                <input value={form.manufacturer} onChange={e => setForm(f => ({...f, manufacturer: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                  placeholder="e.g. Trijicon" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Model</label>
                  <input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Caliber</label>
                  <input value={form.caliber} onChange={e => setForm(f => ({...f, caliber: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                    placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Purchase Price</label>
                  <input type="number" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Image URL</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]"
                    placeholder="https://..." />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-vault-border shrink-0 flex items-center justify-between">
          {view === "browse" ? (
            <>
              <span className="text-xs text-vault-text-faint">
                {filtered.length} accessory{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={onClose}
                className="text-sm text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 px-4 py-1.5 rounded-md transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={creating}
                className="text-sm text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {creating ? "Creating..." : "Create & Assign"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Weapon Canvas ─────────────────────────────────────────────

interface WeaponCanvasProps {
  build: Build;
  onSlotClick: (slotType: SlotType) => void;
  onRemoveSlot: (slotType: SlotType) => void;
}

function WeaponCanvas({ build, onSlotClick, onRemoveSlot }: WeaponCanvasProps) {
  const firearmType = build.firearm.type as FirearmType;
  const positions = SLOT_POSITIONS[firearmType] ?? {};
  const availableSlots = SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];

  const slotMap: Partial<Record<SlotType, BuildSlot>> = {};
  for (const slot of build.slots) {
    slotMap[slot.slotType as SlotType] = slot;
  }

  return (
    <div className="relative w-full h-full bg-vault-canvas overflow-hidden">
      <div className="absolute inset-0 tactical-grid opacity-60" />
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#00C2FF]/20" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#00C2FF]/20" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#00C2FF]/20" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#00C2FF]/20" />

      <div className="absolute inset-0 flex items-center justify-center p-16">
        {build.firearm.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={build.firearm.imageUrl}
            alt={build.firearm.name}
            className="w-full h-full object-contain"
            style={{ filter: "drop-shadow(0 0 24px rgba(0,194,255,0.12))" }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center select-none">
            <Shield className="w-20 h-20 text-vault-border" />
            <div>
              <p className="text-lg font-bold text-vault-border">{build.firearm.name}</p>
              <p className="text-xs text-vault-surface-2 font-mono mt-1 uppercase tracking-widest">
                {build.firearm.type}
              </p>
            </div>
          </div>
        )}
      </div>

      {availableSlots.map((slotType) => {
        const pos = positions[slotType];
        if (!pos) return null;

        const slot = slotMap[slotType];
        const hasAccessory = !!slot?.accessory;
        const slotIconConfig = SLOT_ICONS[slotType];
        const SlotIcon = slotIconConfig?.icon ?? Shield;

        if (hasAccessory && slot?.accessory) {
          const acc = slot.accessory;
          return (
            <div
              key={slotType}
              className="absolute z-10 group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="relative">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-medium cursor-default whitespace-nowrap max-w-[140px]"
                  style={{
                    backgroundColor: "var(--vault-canvas)",
                    borderColor: `${slotIconConfig?.color ?? "#00C2FF"}40`,
                    color: slotIconConfig?.color ?? "#00C2FF",
                    boxShadow: `0 0 10px ${slotIconConfig?.color ?? "#00C2FF"}20`,
                  }}
                >
                  <SlotIcon className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{acc.name}</span>
                </div>
                <div
                  className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap"
                  style={{ backgroundColor: "var(--vault-canvas)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
                >
                  {acc.roundCount.toLocaleString()}r
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveSlot(slotType); }}
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-[#E53935] text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        }

        return (
          <button
            key={slotType}
            onClick={() => onSlotClick(slotType)}
            className="absolute z-10 group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
            title={`Add ${SLOT_TYPE_LABELS[slotType]}`}
          >
            <div className="relative flex items-center justify-center w-5 h-5">
              <div
                className="absolute w-5 h-5 rounded-full animate-pulse-ring"
                style={{
                  backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}18`,
                  border: `1px solid ${slotIconConfig?.color ?? "#8B9DB0"}50`,
                }}
              />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}80` }} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-vault-canvas border border-vault-border rounded text-[10px] text-vault-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {SLOT_TYPE_LABELS[slotType]}
              </div>
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        <p className="text-[10px] font-mono text-vault-border uppercase tracking-[0.3em]">
          {build.name}
        </p>
      </div>
    </div>
  );
}

// ─── Slot Panel ────────────────────────────────────────────────

interface SlotPanelProps {
  build: Build;
  allBuilds: Build[];
  onSlotClick: (slotType: SlotType) => void;
  onRemoveSlot: (slotType: SlotType) => void;
  onSwitchBuild: (buildId: string) => void;
  onStatusChange: (status: string) => void;
  onNotesSaved: () => void;
}

function SlotPanel({
  build,
  allBuilds,
  onSlotClick,
  onRemoveSlot,
  onSwitchBuild,
  onStatusChange,
  onNotesSaved,
}: SlotPanelProps) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const firearmType = build.firearm.type as FirearmType;
  const availableSlots = SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];

  const slotMap: Partial<Record<SlotType, BuildSlot>> = {};
  for (const slot of build.slots) {
    slotMap[slot.slotType as SlotType] = slot;
  }

  const otherBuilds = allBuilds.filter((b) => b.id !== build.id);
  const filledCount = build.slots.filter((s) => s.accessoryId).length;

  const totalCost = build.slots.reduce(
    (sum, s) => sum + (s.accessory?.purchasePrice ?? 0),
    0
  );

  // Build category groups filtered to this firearm type's available slots
  const categoryGroups = SLOT_CATEGORIES.map((cat) => ({
    label: cat.label,
    slots: cat.slots.filter((s) => availableSlots.includes(s as SlotType)) as SlotType[],
  })).filter((cat) => cat.slots.length > 0);

  function isCategoryOpen(label: string) {
    return openCategories[label] !== false; // default open
  }

  function toggleCategory(label: string) {
    setOpenCategories((prev) => ({ ...prev, [label]: !isCategoryOpen(label) }));
  }

  async function handleNotesBlur(e: React.FocusEvent<HTMLTextAreaElement>) {
    const notes = e.target.value;
    setNotesSaving(true);
    try {
      await fetch(`/api/builds/${build.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setNotesSaved(true);
      onNotesSaved();
      setTimeout(() => setNotesSaved(false), 2000);
    } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className="h-full flex flex-col bg-vault-surface border-t md:border-t-0 border-l-0 md:border-l border-vault-border">
      {/* Panel header */}
      <div className="px-4 py-4 border-b border-vault-border shrink-0">
        <p className="text-[10px] text-vault-text-faint uppercase tracking-widest font-mono mb-1">
          {build.firearm.name} &middot; {build.firearm.caliber}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-bold text-vault-text leading-tight truncate">
            {build.name}
          </h2>
          {build.isActive && (
            <span className="shrink-0 flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          )}
        </div>

        {/* Build status selector */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {BUILD_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onStatusChange(s.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${
                build.status === s.value
                  ? s.value === "in-progress"
                    ? "border-[#00C2FF]/60 bg-[#00C2FF]/10 text-[#00C2FF]"
                    : s.value === "complete"
                      ? "border-[#00C853]/60 bg-[#00C853]/10 text-[#00C853]"
                      : "border-[#F5A623]/60 bg-[#F5A623]/10 text-[#F5A623]"
                  : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Slot fill progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-vault-text-faint">
              {filledCount}/{availableSlots.length} slots configured
            </span>
            <span className="text-[10px] text-vault-text-faint font-mono">
              {Math.round((filledCount / (availableSlots.length || 1)) * 100)}%
            </span>
          </div>
          <div className="h-0.5 bg-vault-border rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C2FF] rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / (availableSlots.length || 1)) * 100}%` }}
            />
          </div>
          {totalCost > 0 && (
            <p className="text-[10px] text-vault-text-muted mt-1.5 font-mono">
              Build Cost: <span className="text-[#F5A623]">{formatCurrency(totalCost)}</span>
            </p>
          )}
        </div>

        {/* Switch build dropdown */}
        {otherBuilds.length > 0 && (
          <div className="relative mt-3">
            <button
              onClick={() => setSwitchOpen((o) => !o)}
              className="flex items-center justify-between w-full text-xs text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 rounded-md px-3 py-2 transition-colors"
            >
              <span>Switch Build</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${switchOpen ? "rotate-180" : ""}`} />
            </button>
            {switchOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-vault-bg border border-vault-border rounded-md shadow-xl overflow-hidden">
                {otherBuilds.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { onSwitchBuild(b.id); setSwitchOpen(false); }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm text-vault-text hover:bg-vault-surface transition-colors"
                  >
                    <span className="truncate">{b.name}</span>
                    {b.isActive && (
                      <span className="ml-2 shrink-0 text-[9px] text-[#00C853] font-mono">ACTIVE</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slot list — grouped by category */}
      <div className="flex-1 overflow-y-auto">
        {categoryGroups.map((cat) => {
          const isOpen = isCategoryOpen(cat.label);
          const catFilledCount = cat.slots.filter((st) => slotMap[st]?.accessoryId).length;

          return (
            <Collapsible.Root key={cat.label} open={isOpen} onOpenChange={() => toggleCategory(cat.label)}>
              <Collapsible.Trigger asChild>
                <button className="w-full flex items-center justify-between px-4 py-2.5 bg-vault-bg border-b border-vault-border hover:bg-vault-surface-2 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`w-3 h-3 text-vault-text-faint transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-vault-text-muted">
                      {cat.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-vault-text-faint">
                    {catFilledCount}/{cat.slots.length}
                  </span>
                </button>
              </Collapsible.Trigger>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <Collapsible.Content forceMount asChild>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {cat.slots.map((slotType) => {
                        const slot = slotMap[slotType];
                        const hasAccessory = !!slot?.accessory;
                        const slotIconConfig = SLOT_ICONS[slotType];
                        const SlotIcon = slotIconConfig?.icon ?? Shield;

                        return (
                          <div
                            key={slotType}
                            className="flex items-center gap-3 px-4 py-3 border-b border-[#1C2530]/50 transition-colors hover:bg-vault-bg"
                          >
                            <div
                              className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: hasAccessory
                                  ? `${slotIconConfig?.color ?? "#8B9DB0"}15`
                                  : "transparent",
                              }}
                            >
                              <SlotIcon
                                className="w-3.5 h-3.5"
                                style={{
                                  color: hasAccessory
                                    ? slotIconConfig?.color ?? "#8B9DB0"
                                    : "#2A3B4C",
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] uppercase tracking-widest font-mono ${
                                hasAccessory ? "text-vault-text-faint" : "text-vault-text-faint"
                              }`}>
                                {SLOT_TYPE_LABELS[slotType]}
                              </p>
                              {hasAccessory && slot?.accessory ? (
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs font-medium text-vault-text truncate">
                                    {slot.accessory.name}
                                  </p>
                                  <span className="shrink-0 text-[9px] font-mono text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-1.5 py-0.5 rounded">
                                    {slot.accessory.roundCount.toLocaleString()}r
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[10px] text-vault-text-faint mt-0.5">Empty</p>
                              )}
                            </div>

                            <div className="shrink-0">
                              {hasAccessory ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onSlotClick(slotType)}
                                    className="text-[10px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-2 py-1 rounded transition-colors"
                                  >
                                    Change
                                  </button>
                                  <button
                                    onClick={() => onRemoveSlot(slotType)}
                                    className="w-6 h-6 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => onSlotClick(slotType)}
                                  className="flex items-center gap-1 text-[10px] text-vault-text-faint hover:text-[#00C2FF] border border-[#1C2530]/60 hover:border-[#00C2FF]/40 px-2 py-1 rounded transition-colors"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  Attach
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  </Collapsible.Content>
                )}
              </AnimatePresence>
            </Collapsible.Root>
          );
        })}

        {/* Notes section */}
        <div className="px-4 py-4 border-t border-vault-border mt-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint">
              Notes
            </label>
            <AnimatePresence>
              {(notesSaving || notesSaved) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1 text-[10px] text-[#00C853]"
                >
                  {notesSaving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {notesSaving ? "Saving…" : "Saved"}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <textarea
            ref={notesRef}
            defaultValue={build.notes ?? ""}
            onBlur={handleNotesBlur}
            rows={3}
            placeholder="Add notes about this build…"
            className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-xs focus:outline-none focus:border-[#00C2FF] resize-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Configurator Page ────────────────────────────────────

export default function BuildConfiguratorPage() {
  const params = useParams<{ id: string; buildId: string }>();
  const router = useRouter();
  const toast = useToast();
  const firearmId = params.id;
  const buildId = params.buildId;

  const [build, setBuild] = useState<Build | null>(null);
  const [allBuilds, setAllBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingBuild, setActivatingBuild] = useState(false);
  const [browserSlot, setBrowserSlot] = useState<SlotType | null>(null);

  const fetchBuild = useCallback(async () => {
    try {
      const [buildRes, allBuildsRes] = await Promise.all([
        fetch(`/api/builds/${buildId}`),
        fetch(`/api/builds?firearmId=${firearmId}`),
      ]);
      const buildData = await buildRes.json();
      const allBuildsData = await allBuildsRes.json();

      if (!buildRes.ok) {
        setError(buildData.error ?? "Build not found");
      } else {
        setBuild(buildData);
      }
      if (allBuildsRes.ok && Array.isArray(allBuildsData)) {
        setAllBuilds(allBuildsData);
      }
    } catch {
      setError("Failed to load build");
    } finally {
      setLoading(false);
    }
  }, [buildId, firearmId]);

  useEffect(() => {
    fetchBuild();
  }, [fetchBuild]);

  async function handleRemoveSlot(slotType: SlotType) {
    if (!build) return;
    try {
      await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId: null }),
      });
      toast.info("Part removed");
      fetchBuild();
    } catch {
      // silently fail
    }
  }

  async function handleActivate() {
    if (!build || build.isActive) return;
    setActivatingBuild(true);
    try {
      await fetch(`/api/builds/${buildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      toast.success("Build activated");
      fetchBuild();
    } catch {
      // silently fail
    } finally {
      setActivatingBuild(false);
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await fetch(`/api/builds/${buildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status updated");
      fetchBuild();
    } catch {
      toast.error("Failed to update status");
    }
  }

  function handleSwitchBuild(newBuildId: string) {
    router.push(`/vault/${firearmId}/builds/${newBuildId}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas">
        <Loader2 className="w-10 h-10 text-[#00C2FF] animate-spin mb-4" />
        <p className="text-sm text-vault-text-muted font-mono uppercase tracking-widest">
          Loading Configurator...
        </p>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas gap-4">
        <AlertCircle className="w-12 h-12 text-[#E53935]" />
        <p className="text-[#E53935]">{error ?? "Build not found"}</p>
        <Link href={`/vault/${firearmId}`} className="text-sm text-[#00C2FF] hover:underline">
          Back to Firearm
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-vault-canvas overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-vault-border bg-vault-bg shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href={`/vault/${firearmId}`}
            className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{build.firearm.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <span className="text-vault-border text-xs">/</span>
          <span className="text-xs text-vault-text font-medium">{build.name}</span>
          {build.isActive && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          )}
          <BuildStatusBadge status={build.status} />
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-mono text-vault-text-faint border border-vault-border px-2 py-0.5 rounded uppercase">
            {build.firearm.type}
          </span>
          {!build.isActive ? (
            <button
              onClick={handleActivate}
              disabled={activatingBuild}
              className="flex items-center gap-1.5 text-xs bg-[#00C853]/10 border border-[#00C853]/40 text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
            >
              {activatingBuild ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Activate Build
            </button>
          ) : (
            <span className="text-xs text-vault-text-faint px-3 py-1.5 border border-vault-border rounded">
              Build Active
            </span>
          )}
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="relative h-64 md:h-auto shrink-0 md:shrink md:[flex:0_0_65%]">
          <WeaponCanvas
            build={build}
            onSlotClick={(slotType) => setBrowserSlot(slotType)}
            onRemoveSlot={handleRemoveSlot}
          />
        </div>

        <div className="flex-1 md:[flex:0_0_35%] overflow-hidden">
          <SlotPanel
            build={build}
            allBuilds={allBuilds}
            onSlotClick={(slotType) => setBrowserSlot(slotType)}
            onRemoveSlot={handleRemoveSlot}
            onSwitchBuild={handleSwitchBuild}
            onStatusChange={handleStatusChange}
            onNotesSaved={() => {}}
          />
        </div>
      </div>

      {browserSlot && (
        <AccessoryBrowserModal
          slotType={browserSlot}
          buildId={buildId}
          onClose={() => setBrowserSlot(null)}
          onAssigned={() => {
            setBrowserSlot(null);
            toast.success("Part assigned");
            fetchBuild();
          }}
        />
      )}
    </div>
  );
}
