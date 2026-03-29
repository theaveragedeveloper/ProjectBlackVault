"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  Pencil,
  Trash2,
} from "lucide-react";
import { SLOTS_BY_FIREARM_TYPE, SUGGESTED_SLOTS_BY_FIREARM_TYPE, SLOT_TYPE_LABELS, CUSTOM_SLOT_PREFIX, FirearmType, SlotType } from "@/lib/types";
import { SLOT_ICONS } from "@/lib/configurator/slot-icons";
import { RoundCountBadge } from "@/components/shared/RoundCountBadge";

function getSlotLabel(slotType: string) {
  if (slotType.startsWith(CUSTOM_SLOT_PREFIX)) {
    return slotType.slice(CUSTOM_SLOT_PREFIX.length) || "Custom Slot";
  }
  return SLOT_TYPE_LABELS[slotType as SlotType] ?? slotType;
}

function getSlotIconConfig(slotType: string) {
  return SLOT_ICONS[slotType as SlotType];
}

// ─── Types ────────────────────────────────────────────────────

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  type: string;
  caliber: string | null;
  roundCount: number;
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
  slotType: string;
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
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    caliber: "",
    purchasePrice: "",
    acquisitionDate: "",
    initialRoundCount: "",
    notes: "",
    imageUrl: "",
    hasBattery: false,
    batteryType: "",
    replacementIntervalDays: "",
    lastBatteryChangeDate: "",
  });
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
      // Create the accessory
      const createRes = await fetch("/api/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          manufacturer: form.manufacturer.trim(),
          model: form.model.trim() || undefined,
          serialNumber: form.serialNumber.trim() || undefined,
          type: slotType,
          caliber: form.caliber.trim() || undefined,
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
          acquisitionDate: form.acquisitionDate || undefined,
          initialRoundCount: form.initialRoundCount ? parseInt(form.initialRoundCount, 10) : undefined,
          notes: form.notes.trim() || undefined,
          imageUrl: form.imageUrl.trim() || undefined,
          hasBattery: form.hasBattery,
          batteryType: form.batteryType.trim() || undefined,
          replacementIntervalDays: form.replacementIntervalDays
            ? parseInt(form.replacementIntervalDays, 10)
            : undefined,
          lastBatteryChangeDate: form.lastBatteryChangeDate || undefined,
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        setCreateError(created.error ?? "Failed to create accessory");
        return;
      }
      // Assign to slot
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

  const slotIconConfig = getSlotIconConfig(slotType);
  const SlotIcon = slotIconConfig?.icon ?? Shield;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--vault-overlay)" }}
    >
      <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-2xl max-h-[85svh] flex flex-col animate-slide-up shadow-2xl">
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
                {getSlotLabel(slotType)}
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
                placeholder={`Search ${getSlotLabel(slotType)} accessories...`}
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Error banner (browse view assign errors) */}
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
                    : `No ${getSlotLabel(slotType)} accessories in your collection`}
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
                      {/* Thumbnail */}
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

                      {/* Info */}
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

                      {/* Action */}
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
              {/* Pre-filled slot type - readonly display */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Type</label>
                <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text-muted font-mono">
                  {getSlotLabel(slotType)}
                </div>
              </div>
              {/* Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                  placeholder="e.g. Trijicon ACOG 4x32" />
              </div>
              {/* Manufacturer */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Manufacturer *</label>
                <input value={form.manufacturer} onChange={e => setForm(f => ({...f, manufacturer: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                  placeholder="e.g. Trijicon" />
              </div>
              {/* Model + Caliber side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Model</label>
                  <input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                    placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Caliber</label>
                  <input value={form.caliber} onChange={e => setForm(f => ({...f, caliber: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                    placeholder="Optional" />
                </div>
              </div>
              {/* Serial Number */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Serial Number</label>
                <input value={form.serialNumber} onChange={e => setForm(f => ({...f, serialNumber: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                  placeholder="Optional" />
              </div>
              {/* Purchase Price + Date Acquired side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Purchase Price</label>
                  <input type="number" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Date Acquired</label>
                  <input type="date" value={form.acquisitionDate} onChange={e => setForm(f => ({...f, acquisitionDate: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint" />
                </div>
              </div>
              {/* Prior Use (rounds) */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Prior Use (rounds)</label>
                <input type="number" min="0" step="1" value={form.initialRoundCount} onChange={e => setForm(f => ({...f, initialRoundCount: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                  placeholder="0" />
              </div>

              <div className="rounded-md border border-vault-border p-3 space-y-3">
                <label className="flex items-center gap-2 text-xs text-vault-text-muted">
                  <input
                    type="checkbox"
                    checked={form.hasBattery}
                    onChange={(e) => setForm((f) => ({ ...f, hasBattery: e.target.checked }))}
                    className="rounded border-vault-border"
                  />
                  This accessory uses a battery
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Battery Type</label>
                    <input value={form.batteryType} onChange={e => setForm(f => ({...f, batteryType: e.target.value}))}
                      className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                      placeholder="e.g. CR2032" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Replacement Interval (days)</label>
                    <input type="number" min="1" step="1" value={form.replacementIntervalDays} onChange={e => setForm(f => ({...f, replacementIntervalDays: e.target.value}))}
                      className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                      placeholder="180" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Last Battery Change</label>
                  <input type="date" value={form.lastBatteryChangeDate} onChange={e => setForm(f => ({...f, lastBatteryChangeDate: e.target.value}))}
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint" />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  rows={3}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint resize-none"
                  placeholder="Optional notes..." />
              </div>
              {/* Image URL */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Image URL</label>
                <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))}
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                  placeholder="https://..." />
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
  onSlotClick: (slotType: string) => void;
  onRemoveSlot: (slotType: string) => void;
  onAddSlot: (slotType: string) => Promise<void>;
  onAddCustomSlot: (label: string) => Promise<void>;
}

function WeaponCanvas({ build, onSlotClick, onRemoveSlot, onAddSlot, onAddCustomSlot }: WeaponCanvasProps) {
  const firearmType = build.firearm.type as FirearmType;
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [customSlotInput, setCustomSlotInput] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [customSlotError, setCustomSlotError] = useState<string | null>(null);

  // Only slots that are explicitly in build.slots (added by user)
  const addedSlotTypes = build.slots.map((s) => s.slotType);

  const slotMap: Record<string, BuildSlot> = {};
  for (const slot of build.slots) {
    slotMap[slot.slotType] = slot;
  }

  const suggestedSlots: string[] = SUGGESTED_SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];
  const allBaseSlots: string[] = SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];
  const otherSlots = allBaseSlots.filter((s) => !suggestedSlots.includes(s));

  async function handlePickSlot(slotType: string) {
    if (addedSlotTypes.includes(slotType)) return;
    await onAddSlot(slotType);
    setShowSlotPicker(false);
  }

  async function handleAddCustom() {
    const trimmed = customSlotInput.trim();
    if (!trimmed) {
      setCustomSlotError("Enter a custom slot name first.");
      return;
    }
    const slotType = `${CUSTOM_SLOT_PREFIX}${trimmed}`;
    if (addedSlotTypes.includes(slotType)) {
      setCustomSlotError("That slot already exists.");
      return;
    }
    setAddingCustom(true);
    setCustomSlotError(null);
    try {
      await onAddCustomSlot(trimmed);
      setCustomSlotInput("");
      setShowSlotPicker(false);
    } catch {
      setCustomSlotError("Could not create custom slot.");
    } finally {
      setAddingCustom(false);
    }
  }

  return (
    <div className="bg-vault-canvas p-4 md:h-full md:overflow-y-auto md:p-5">
      <div className="bg-vault-surface border border-vault-border rounded-xl p-4 md:p-5">
        <p className="text-[10px] text-vault-text-faint uppercase tracking-widest font-mono mb-1">
          Build Configurator
        </p>
        <h2 className="text-base font-semibold text-vault-text">{build.name}</h2>
        <p className="text-xs text-vault-text-muted mt-1">
          Add slots for each attachment position, then assign accessories to them.
        </p>

        {/* Existing added slots */}
        {addedSlotTypes.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {addedSlotTypes.map((slotType) => {
              const slot = slotMap[slotType];
              const hasAccessory = !!slot?.accessory;
              const slotIconConfig = getSlotIconConfig(slotType);
              const SlotIcon = slotIconConfig?.icon ?? Shield;

              return (
                <div
                  key={slotType}
                  className={`rounded-lg border p-3 md:p-4 ${
                    hasAccessory
                      ? "border-vault-border bg-vault-bg"
                      : "border-vault-border/80 bg-vault-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint">{getSlotLabel(slotType)}</p>
                      <span
                        className={`inline-flex mt-1 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                          hasAccessory
                            ? "text-[#00C853] border-[#00C853]/35 bg-[#00C853]/10"
                            : "text-vault-text-faint border-vault-border bg-vault-bg/60"
                        }`}
                      >
                        {hasAccessory ? "Configured" : "Empty"}
                      </span>
                      {hasAccessory && slot?.accessory ? (
                        <>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-sm font-medium text-vault-text truncate min-w-0">
                              {slot.accessory.name}
                            </p>
                            <Link
                              href={`/accessories/${slot.accessory.id}/edit`}
                              className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border border-vault-border text-vault-text-faint hover:border-[#00C2FF]/50 hover:text-[#00C2FF] transition-colors"
                              title="Edit accessory"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              Edit
                            </Link>
                          </div>
                          <p className="text-[11px] text-vault-text-faint mt-0.5 truncate">
                            {slot.accessory.manufacturer}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-vault-text-faint mt-1">No accessory assigned</p>
                      )}
                    </div>

                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${slotIconConfig?.color ?? "#8B9DB0"}18` }}
                    >
                      <SlotIcon
                        className="w-4 h-4"
                        style={{ color: slotIconConfig?.color ?? "#8B9DB0" }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => onSlotClick(slotType)}
                      className="flex-1 min-h-9 px-3 py-2 text-xs font-medium rounded-md border border-[#00C2FF]/35 text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors"
                    >
                      {hasAccessory ? "Change" : "Add Attachment"}
                    </button>

                    {hasAccessory && (
                      <button
                        onClick={() => onRemoveSlot(slotType)}
                        className="min-h-9 px-3 py-2 text-xs font-medium rounded-md border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state when no slots added yet */}
        {addedSlotTypes.length === 0 && !showSlotPicker && (
          <div className="mt-4 flex flex-col items-center justify-center py-10 border border-dashed border-vault-border rounded-lg gap-3">
            <div className="w-10 h-10 rounded-full bg-vault-border/30 flex items-center justify-center">
              <Plus className="w-5 h-5 text-vault-text-faint" />
            </div>
            <p className="text-sm text-vault-text-muted text-center">No slots added yet.</p>
            <p className="text-xs text-vault-text-faint text-center max-w-xs">
              Add slots for each attachment position on this build — optic, barrel, stock, and more.
            </p>
          </div>
        )}

        {/* Add Slot button */}
        <div className="mt-4">
          <button
            onClick={() => setShowSlotPicker((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#00C2FF]/35 text-[#00C2FF] text-xs font-medium hover:bg-[#00C2FF]/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showSlotPicker ? "Cancel" : "+ Add Slot"}
          </button>
        </div>

        {/* Slot Picker Panel */}
        {showSlotPicker && (
          <div className="mt-3 border border-vault-border rounded-xl bg-vault-bg p-4 space-y-5">
            {/* Section A — Suggested */}
            {suggestedSlots.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint mb-2">
                  Suggested for {build.firearm.type.replace(/_/g, " ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSlots.map((slotType) => {
                    const alreadyAdded = addedSlotTypes.includes(slotType);
                    return (
                      <button
                        key={slotType}
                        onClick={() => handlePickSlot(slotType)}
                        disabled={alreadyAdded}
                        className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                          alreadyAdded
                            ? "opacity-40 cursor-not-allowed border-vault-border text-vault-text-faint"
                            : "border-[#00C2FF]/40 text-[#00C2FF] hover:bg-[#00C2FF]/10 cursor-pointer"
                        }`}
                      >
                        {SLOT_TYPE_LABELS[slotType as SlotType] ?? slotType}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section B — All Other Slots */}
            {otherSlots.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint mb-2">
                  Other Slots
                </p>
                <div className="flex flex-wrap gap-2">
                  {otherSlots.map((slotType) => {
                    const alreadyAdded = addedSlotTypes.includes(slotType);
                    return (
                      <button
                        key={slotType}
                        onClick={() => handlePickSlot(slotType)}
                        disabled={alreadyAdded}
                        className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                          alreadyAdded
                            ? "opacity-40 cursor-not-allowed border-vault-border text-vault-text-faint"
                            : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40 hover:text-vault-text cursor-pointer"
                        }`}
                      >
                        {SLOT_TYPE_LABELS[slotType as SlotType] ?? slotType}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-vault-border" />

            {/* Section C — Custom Slot */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-mono text-vault-text-faint mb-2">
                Custom Slot
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={customSlotInput}
                  onChange={(e) => setCustomSlotInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
                  placeholder="e.g. Data Card, Suppressor Cover"
                  className="flex-1 bg-vault-surface border border-vault-border rounded-md px-2.5 py-1.5 text-xs text-vault-text focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
                />
                <button
                  onClick={handleAddCustom}
                  disabled={addingCustom}
                  className="px-3 py-1.5 rounded-md text-xs border border-[#00C2FF]/35 text-[#00C2FF] hover:bg-[#00C2FF]/10 disabled:opacity-60"
                >
                  {addingCustom ? "Adding..." : "Add"}
                </button>
              </div>
              {customSlotError && (
                <p className="text-[10px] text-[#E53935] mt-1">{customSlotError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Slot Panel ────────────────────────────────────────────────

interface SlotPanelProps {
  build: Build;
  allBuilds: Build[];
  onSwitchBuild: (buildId: string) => void;
}

function SlotPanel({
  build,
  allBuilds,
  onSwitchBuild,
}: SlotPanelProps) {
  const [switchOpen, setSwitchOpen] = useState(false);
  // Only slots that have been explicitly added (exist in build.slots)
  const addedSlotTypes = build.slots.map((slot) => slot.slotType);

  const slotMap: Record<string, BuildSlot> = {};
  for (const slot of build.slots) {
    slotMap[slot.slotType] = slot;
  }

  const otherBuilds = allBuilds.filter((b) => b.id !== build.id);
  const filledCount = build.slots.filter((s) => s.accessoryId).length;
  const totalSlots = addedSlotTypes.length;

  return (
    <div className="flex flex-col bg-vault-surface border-t md:h-full md:border-t-0 border-l-0 md:border-l border-vault-border">
      {/* Panel header */}
      <div className="px-4 py-4 border-b border-vault-border shrink-0">
        <p className="text-[10px] text-vault-text-faint uppercase tracking-widest font-mono mb-1">
          {build.firearm.name} &middot; {build.firearm.caliber}
        </p>
        <div className="flex items-center gap-2">
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

        {/* Slot fill progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-vault-text-faint">
              {filledCount}/{totalSlots} slots configured
            </span>
            <span className="text-[10px] text-vault-text-faint font-mono">
              {Math.round((filledCount / (totalSlots || 1)) * 100)}%
            </span>
          </div>
          <div className="h-0.5 bg-vault-border rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00C2FF] rounded-full transition-all duration-500"
              style={{
                width: `${(filledCount / (totalSlots || 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Switch build dropdown */}
        {otherBuilds.length > 0 && (
          <div className="relative mt-3">
            <button
              onClick={() => setSwitchOpen((o) => !o)}
              className="flex items-center justify-between w-full text-xs text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 rounded-md px-3 py-2 transition-colors"
            >
              <span>Switch Build</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${switchOpen ? "rotate-180" : ""}`}
              />
            </button>
            {switchOpen && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-vault-bg border border-vault-border rounded-md shadow-xl overflow-hidden">
                {otherBuilds.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onSwitchBuild(b.id);
                      setSwitchOpen(false);
                    }}
                    className="flex items-center justify-between w-full text-left px-3 py-2 text-sm text-vault-text hover:bg-vault-surface transition-colors"
                  >
                    <span className="truncate">{b.name}</span>
                    {b.isActive && (
                      <span className="ml-2 shrink-0 text-[9px] text-[#00C853] font-mono">
                        ACTIVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slot list — only added slots */}
      <div className="md:flex-1 md:overflow-y-auto">
        {addedSlotTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-2">
            <p className="text-xs text-vault-text-faint text-center">No slots added yet.</p>
            <p className="text-[10px] text-vault-border text-center">Use &quot;+ Add Slot&quot; to get started.</p>
          </div>
        ) : (
          addedSlotTypes.map((slotType) => {
            const slot = slotMap[slotType];
            const hasAccessory = !!slot?.accessory;
            const slotIconConfig = getSlotIconConfig(slotType);
            const SlotIcon = slotIconConfig?.icon ?? Shield;

            return (
              <div
                key={slotType}
                className="flex items-center gap-3 px-4 py-3 border-b border-[#1C2530]/50"
              >
                {/* Icon */}
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

                {/* Label + content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-[10px] uppercase tracking-widest font-mono ${
                      hasAccessory ? "text-vault-text-faint" : "text-vault-border"
                    }`}
                  >
                    {getSlotLabel(slotType)}
                  </p>
                  {hasAccessory && slot?.accessory ? (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs font-medium text-vault-text truncate">
                        {slot.accessory.name}
                      </p>
                      <RoundCountBadge roundCount={slot.accessory.roundCount} className="text-[9px]" />
                      <Link
                        href={`/accessories/${slot.accessory.id}/edit`}
                        className="flex items-center gap-0.5 px-1 py-0.5 text-[9px] rounded border border-vault-border text-vault-text-faint hover:border-[#00C2FF]/50 hover:text-[#00C2FF] transition-colors"
                        title="Edit accessory"
                      >
                        <Pencil className="w-2 h-2" />
                        Edit
                      </Link>
                    </div>
                  ) : (
                    <p className="text-[10px] text-vault-border mt-0.5">Empty</p>
                  )}
                </div>

                <span
                  className={`shrink-0 text-[9px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                    hasAccessory
                      ? "text-[#00C853] border-[#00C853]/35 bg-[#00C853]/10"
                      : "text-vault-text-faint border-vault-border"
                  }`}
                >
                  {hasAccessory ? "Configured" : "Empty"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Configurator Page ────────────────────────────────────

export default function BuildConfiguratorPage() {
  const params = useParams<{ id: string; buildId: string }>();
  const router = useRouter();
  const firearmId = Array.isArray(params.id) ? params.id[0] : params.id;
  const buildId = Array.isArray(params.buildId) ? params.buildId[0] : params.buildId;

  const [build, setBuild] = useState<Build | null>(null);
  const [allBuilds, setAllBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activatingBuild, setActivatingBuild] = useState(false);

  // Delete build state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccessories, setDeleteAccessories] = useState<"keep" | "delete">("keep");
  const [deletingBuild, setDeletingBuild] = useState(false);

  // Modal state
  const [browserSlot, setBrowserSlot] = useState<string | null>(null);

  const fetchBuild = useCallback(async () => {
    if (!firearmId || !buildId) {
      setError("Invalid build route.");
      setLoading(false);
      return;
    }
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

  async function handleRemoveSlot(slotType: string) {
    if (!build) return;
    try {
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId: null }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not remove accessory from slot.");
      }
      setActionFeedback({ type: "success", text: "Accessory removed from slot." });
      fetchBuild();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not remove accessory from slot.",
      });
    }
  }

  async function handleActivate() {
    if (!build || build.isActive) return;
    setActivatingBuild(true);
    try {
      const res = await fetch(`/api/builds/${buildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? "Could not activate build.");
      }
      setActionFeedback({ type: "success", text: "Build set as active." });
      fetchBuild();
    } catch (err) {
      setActionFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not activate build.",
      });
    } finally {
      setActivatingBuild(false);
    }
  }

  function handleSwitchBuild(newBuildId: string) {
    router.push(`/vault/${firearmId}/builds/${newBuildId}`);
  }

  async function handleDeleteBuild() {
    setDeletingBuild(true);
    try {
      const res = await fetch(`/api/builds/${buildId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAccessories: deleteAccessories === "delete" }),
      });
      if (res.ok) {
        router.push(`/vault/${firearmId}`);
      } else {
        setDeletingBuild(false);
      }
    } catch {
      setDeletingBuild(false);
    }
  }

  async function handleAddSlot(slotType: string) {
    try {
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotType,
          accessoryId: null,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setActionFeedback({ type: "error", text: payload?.error ?? "Could not add slot." });
        return;
      }
      await fetchBuild();
    } catch {
      setActionFeedback({ type: "error", text: "Could not add slot." });
    }
  }

  async function handleAddCustomSlot(label: string) {
    try {
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotType: `${CUSTOM_SLOT_PREFIX}${label.trim()}`,
          accessoryId: null,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setActionFeedback({ type: "error", text: payload?.error ?? "Could not add slot." });
        return;
      }
      await fetchBuild();
    } catch {
      setActionFeedback({ type: "error", text: "Could not add slot." });
    }
  }

  // ── Loading/error screens ──────────────────────────────────
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

  // ── Main layout ────────────────────────────────────────────
  return (
    <div className="flex min-h-full flex-col bg-vault-canvas">
      {/* Thin header bar */}
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
        </div>

        <div className="flex items-center gap-2">
          {/* Firearm type badge */}
          <span className="hidden sm:inline text-[10px] font-mono text-vault-text-faint border border-vault-border px-2 py-0.5 rounded uppercase">
            {build.firearm.type}
          </span>

          {/* Activate button */}
          {!build.isActive ? (
            <button
              onClick={handleActivate}
              disabled={activatingBuild}
              className="flex items-center gap-1.5 text-xs bg-[#00C853]/10 border border-[#00C853]/40 text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-50 px-3 py-1.5 rounded transition-colors"
            >
              {activatingBuild ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              Activate Build
            </button>
          ) : (
            <span className="text-xs text-vault-text-faint px-3 py-1.5 border border-vault-border rounded">
              Build Active
            </span>
          )}

          {/* Delete button */}
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteAccessories("keep"); }}
            className="flex items-center gap-1.5 text-xs border border-[#E53935]/40 text-[#E53935] hover:bg-[#E53935]/10 px-3 py-1.5 rounded transition-colors"
            aria-label="Delete build"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>
      {actionFeedback && (
        <div
          className={`mx-4 mt-3 rounded-md border px-3 py-2 text-xs ${
            actionFeedback.type === "success"
              ? "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]"
              : "border-[#E53935]/30 bg-[#E53935]/10 text-[#E53935]"
          }`}
        >
          {actionFeedback.text}
        </div>
      )}

      {/* Main split layout — vertical on mobile, side-by-side on md+ */}
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        {/* Config tiles */}
        <div className="md:min-h-0 md:[flex:0_0_65%] border-b md:border-b-0 border-vault-border">
          <WeaponCanvas
            build={build}
            onSlotClick={(slotType) => setBrowserSlot(slotType)}
            onRemoveSlot={handleRemoveSlot}
            onAddSlot={handleAddSlot}
            onAddCustomSlot={handleAddCustomSlot}
          />
        </div>

        {/* Slot Panel — flex below canvas on mobile, 35% on desktop */}
        <div className="md:min-h-0 md:[flex:0_0_35%] md:overflow-hidden">
          <SlotPanel
            build={build}
            allBuilds={allBuilds}
            onSwitchBuild={handleSwitchBuild}
          />
        </div>
      </div>

      {/* Accessory Browser Modal */}
      {browserSlot && (
        <AccessoryBrowserModal
          slotType={browserSlot}
          buildId={buildId}
          onClose={() => setBrowserSlot(null)}
          onAssigned={() => {
            setBrowserSlot(null);
            fetchBuild();
          }}
        />
      )}

      {/* Delete Build Modal */}
      {showDeleteModal && build && (() => {
        const accCount = build.slots.filter((s) => s.accessory).length;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-vault-surface border border-vault-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#E53935]/10 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4 text-[#E53935]" />
                </div>
                <h2 className="text-base font-semibold text-vault-text">Delete Build</h2>
              </div>

              {accCount > 0 ? (
                <>
                  <p className="text-sm text-vault-text-muted mb-4">
                    <span className="text-vault-text font-medium">{build.name}</span> has{" "}
                    <span className="text-vault-text font-medium">{accCount} accessor{accCount !== 1 ? "ies" : "y"}</span>.
                  </p>
                  <div className="space-y-2 mb-5">
                    <p className="text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-2">What should happen to the accessories?</p>
                    {[
                      { value: "keep", label: "Keep accessories in vault" },
                      { value: "delete", label: "Delete accessories too" },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="deleteBuildAccessoriesConfigurator"
                          value={opt.value}
                          checked={deleteAccessories === opt.value}
                          onChange={() => setDeleteAccessories(opt.value as "keep" | "delete")}
                          className="accent-[#00C2FF]"
                        />
                        <span className="text-sm text-vault-text">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-vault-text-muted mb-5">
                  Delete <span className="text-vault-text font-medium">{build.name}</span>? This cannot be undone.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deletingBuild}
                  className="flex-1 px-4 py-2 text-sm text-vault-text-muted border border-vault-border rounded-md hover:border-vault-text-muted/40 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBuild}
                  disabled={deletingBuild}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#E53935]/10 border border-[#E53935]/40 text-[#E53935] rounded-md hover:bg-[#E53935]/20 transition-colors disabled:opacity-50"
                >
                  {deletingBuild ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deletingBuild ? "Deleting..." : "Delete Build"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
