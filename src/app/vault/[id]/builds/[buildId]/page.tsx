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
  Save,
} from "lucide-react";
import { Camera } from "lucide-react";
import { SLOTS_BY_FIREARM_TYPE, SLOT_TYPE_LABELS, FirearmType, SlotType } from "@/lib/types";
import { SafeImage } from "@/components/shared/SafeImage";
import ImagePicker from "@/components/shared/ImagePicker";
import PhotoGallery from "@/components/shared/PhotoGallery";
import { SLOT_ICONS } from "@/lib/configurator/slot-icons";

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
  purchasePrice: number | null;
  notes: string | null;
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
  imageUrl: string | null;
  imageSource: string | null;
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

const FIELD_CLASS =
  "w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint";

// Returns the display label for a custom slot type (strips CUSTOM: prefix and optional category)
function getCustomSlotLabel(slotType: string): string {
  if (!slotType.startsWith("CUSTOM:")) return slotType;
  const rest = slotType.slice(7); // length of "CUSTOM:"
  const pipe = rest.indexOf("|");
  return pipe === -1 ? rest : rest.slice(pipe + 1);
}

// Parses a custom slot type into { category, name } or null if not custom
function parseCustomSlot(slotType: string): { category: string | null; name: string } | null {
  if (!slotType.startsWith("CUSTOM:")) return null;
  const rest = slotType.slice(7);
  const pipe = rest.indexOf("|");
  return pipe === -1
    ? { category: null, name: rest }
    : { category: rest.slice(0, pipe), name: rest.slice(pipe + 1) };
}

// ─── Accessory Edit Modal ──────────────────────────────────────

interface AccessoryEditModalProps {
  accessory: Accessory;
  onClose: () => void;
  onSaved: () => void;
}

function AccessoryEditModal({ accessory, onClose, onSaved }: AccessoryEditModalProps) {
  const [form, setForm] = useState({
    name: accessory.name,
    manufacturer: accessory.manufacturer,
    model: accessory.model ?? "",
    caliber: accessory.caliber ?? "",
    purchasePrice: accessory.purchasePrice != null ? String(accessory.purchasePrice) : "",
    imageUrl: accessory.imageUrl ?? "",
    imageSource: accessory.imageUrl ? "url" : null,
    notes: accessory.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/accessories/${accessory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          manufacturer: form.manufacturer.trim(),
          model: form.model.trim() || null,
          caliber: form.caliber.trim() || null,
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
          imageUrl: form.imageUrl.trim() || null,
          imageSource: form.imageUrl.trim() ? form.imageSource : null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Failed to save");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--vault-overlay)" }}
    >
      <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-sm font-semibold text-vault-text">Edit Accessory</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-vault-text-muted hover:text-vault-text hover:bg-vault-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
              <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
              <p className="text-xs text-[#E53935]">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={FIELD_CLASS}
              placeholder="Accessory name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
                Manufacturer
              </label>
              <input
                value={form.manufacturer}
                onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                className={FIELD_CLASS}
                placeholder="e.g. Trijicon"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
                Model
              </label>
              <input
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                className={FIELD_CLASS}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
                Caliber
              </label>
              <input
                value={form.caliber}
                onChange={(e) => setForm((f) => ({ ...f, caliber: e.target.value }))}
                className={FIELD_CLASS}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
                Purchase Price
              </label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                className={FIELD_CLASS}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
              Image
            </label>
            <ImagePicker
              entityType="accessory"
              entityId={accessory.id}
              currentUrl={form.imageUrl || null}
              onChange={(url, source) =>
                setForm((f) => ({
                  ...f,
                  imageUrl: url ?? "",
                  imageSource: source,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">
              Notes
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={`${FIELD_CLASS} resize-none`}
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-vault-border shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={saving}
            className="text-sm text-vault-text-muted hover:text-vault-text border border-vault-border px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [form, setForm] = useState({ name: "", manufacturer: "", model: "", caliber: "", purchasePrice: "", imageUrl: "", imageSource: null as string | null });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/accessories`)
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
    if (!form.name.trim()) {
      setCreateError("Name is required");
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
          imageSource: form.imageUrl.trim() ? form.imageSource : undefined,
          hasBattery: ["OPTIC", "LIGHT", "LASER"].includes(slotType),
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
  const slotLabel = SLOT_TYPE_LABELS[slotType as SlotType] ?? getCustomSlotLabel(slotType);

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
                {slotLabel}
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

        {view === "browse" && (
          <div className="px-5 py-3 border-b border-vault-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search accessories...`}
                className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
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
                  {search ? "No accessories match your search" : "No accessories in your collection"}
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
                        <SafeImage
                          src={acc.imageUrl}
                          alt={acc.name}
                          width={56}
                          height={56}
                          loading="lazy"
                          className="w-full h-full object-contain p-1"
                          fallback={<SlotIcon className="w-6 h-6" style={{ color: slotIconConfig?.color ?? "#4A5A6B" }} />}
                        />
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
                  {slotLabel}
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                  className={FIELD_CLASS} placeholder="e.g. Trijicon ACOG 4x32" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Manufacturer</label>
                <input value={form.manufacturer} onChange={e => setForm(f => ({...f, manufacturer: e.target.value}))}
                  className={FIELD_CLASS} placeholder="e.g. Trijicon" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Model</label>
                  <input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))}
                    className={FIELD_CLASS} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Caliber</label>
                  <input value={form.caliber} onChange={e => setForm(f => ({...f, caliber: e.target.value}))}
                    className={FIELD_CLASS} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Purchase Price</label>
                  <input type="number" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: e.target.value}))}
                    className={FIELD_CLASS} placeholder="0.00" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Image</label>
                  <ImagePicker
                    entityType="accessory"
                    currentUrl={form.imageUrl || null}
                    onChange={(url, source) =>
                      setForm((f) => ({
                        ...f,
                        imageUrl: url ?? "",
                        imageSource: source,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-5 py-3 border-t border-vault-border shrink-0 flex items-center justify-between">
          {view === "browse" ? (
            <>
              <span className="text-xs text-vault-text-faint">
                {filtered.length} accessor{filtered.length !== 1 ? "ies" : "y"}
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
              <button onClick={onClose} disabled={creating}
                className="text-sm text-vault-text-muted hover:text-vault-text border border-vault-border px-4 py-1.5 rounded-md transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-1.5 rounded-md transition-colors disabled:opacity-50">
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {creating ? "Creating..." : "Create & Assign"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Slot groups ────────────────────────────────────────────────

const SLOT_GROUPS: { label: string; slots: SlotType[] }[] = [
  { label: "Optics", slots: ["OPTIC", "OPTIC_MOUNT"] },
  { label: "Barrel & Muzzle", slots: ["BARREL", "MUZZLE", "SUPPRESSOR", "COMPENSATOR"] },
  { label: "Forend & Rail", slots: ["HANDGUARD", "UNDERBARREL", "BIPOD"] },
  { label: "Internals", slots: ["TRIGGER", "CHARGING_HANDLE", "BUFFER_TUBE", "LOWER_RECEIVER", "UPPER_RECEIVER", "SLIDE", "FRAME"] },
  { label: "Stock & Grip", slots: ["STOCK", "GRIP", "SLING"] },
  { label: "Feed & Accessories", slots: ["MAGAZINE", "LIGHT", "LASER"] },
];

// ─── Gun Banner ──────────────────────────────────────────────────

function GunBanner({ build }: { build: Build }) {
  const [imgError, setImgError] = useState(false);
  const firearmType = build.firearm.type as FirearmType;
  const availableSlots = SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];
  const filledCount = build.slots.filter((s) => s.accessoryId).length;
  const pct = Math.round((filledCount / (availableSlots.length || 1)) * 100);
  const hasPhoto = !!(build.firearm.imageUrl && !imgError);

  return (
    <div className="relative h-28 shrink-0 overflow-hidden bg-vault-canvas border-b border-vault-border">
      {hasPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={build.firearm.imageUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgError(true)}
            style={{ filter: "blur(10px) brightness(0.28)", transform: "scale(1.08)" }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 100%)" }} />
        </>
      ) : (
        <>
          <div className="absolute inset-0 tactical-grid opacity-15" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,194,255,0.04) 0%, transparent 60%)" }} />
        </>
      )}

      <div className="relative h-full flex flex-col justify-between px-5 py-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(0,194,255,0.45)" }}>
            {build.firearm.type.replace(/_/g, " ")} · {build.firearm.caliber}
          </p>
          <h1 className="text-base font-bold text-vault-text leading-tight mt-0.5">
            {build.firearm.name}
          </h1>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-vault-text-muted">{build.name}</span>
            {build.isActive && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-vault-text-faint font-mono">{filledCount}/{availableSlots.length} slots</span>
            <div className="w-20 h-1 bg-vault-border rounded-full overflow-hidden">
              <div className="h-full bg-[#00C2FF] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-mono" style={{ color: "rgba(0,194,255,0.6)" }}>{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loadout Grid ────────────────────────────────────────────────

interface LoadoutGridProps {
  build: Build;
  allBuilds: Build[];
  isEditing: boolean;
  addingSlotInGroup: string | null;
  customSlotInput: string;
  onStartAddingSlot: (groupLabel: string | null) => void;
  onCustomSlotInputChange: (value: string) => void;
  onConfirmAddSlot: () => void;
  onCancelAddingSlot: () => void;
  onDeleteCustomSlot: (slotType: string) => void;
  onSlotClick: (slotType: string) => void;
  onRemoveSlot: (slotType: string) => void;
  onSwitchBuild: (buildId: string) => void;
  onEditAccessory: (accessory: Accessory) => void;
}

function LoadoutGrid({
  build,
  allBuilds,
  isEditing,
  addingSlotInGroup,
  customSlotInput,
  onStartAddingSlot,
  onCustomSlotInputChange,
  onConfirmAddSlot,
  onCancelAddingSlot,
  onDeleteCustomSlot,
  onSlotClick,
  onRemoveSlot,
  onSwitchBuild,
  onEditAccessory,
}: LoadoutGridProps) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const firearmType = build.firearm.type as FirearmType;
  const availableSlots = SLOTS_BY_FIREARM_TYPE[firearmType] ?? [];

  const slotMap: Record<string, BuildSlot> = {};
  for (const slot of build.slots) slotMap[slot.slotType] = slot;

  const otherBuilds = allBuilds.filter((b) => b.id !== build.id);

  // Custom slots with a known group category
  const categorizedCustomSlots = build.slots.filter((slot) => {
    const parsed = parseCustomSlot(slot.slotType);
    return parsed !== null && parsed.category !== null;
  });
  const knownGroupLabels = new Set(SLOT_GROUPS.map((g) => g.label));

  // Uncategorized custom slots: old CUSTOM:<name> format OR category not matching any group
  const uncategorizedCustomSlots = build.slots.filter((slot) => {
    const parsed = parseCustomSlot(slot.slotType);
    return parsed !== null && (parsed.category === null || !knownGroupLabels.has(parsed.category));
  });
  void categorizedCustomSlots; // used implicitly via per-group filter below

  return (
    <div className="bg-vault-bg">
      {otherBuilds.length > 0 && (
        <div className="relative px-4 pt-3 pb-1">
          <button
            onClick={() => setSwitchOpen((o) => !o)}
            className="flex items-center justify-between w-full text-xs text-vault-text-muted hover:text-vault-text border border-vault-border hover:border-vault-text-muted/30 rounded-md px-3 py-2 transition-colors bg-vault-surface"
          >
            <span>Switch Build</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${switchOpen ? "rotate-180" : ""}`} />
          </button>
          {switchOpen && (
            <div className="absolute z-30 top-full left-4 right-4 mt-1 bg-vault-bg border border-vault-border rounded-md shadow-xl overflow-hidden">
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
                  {b.isActive && <span className="ml-2 shrink-0 text-[9px] text-[#00C853] font-mono">ACTIVE</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-5">
        {SLOT_GROUPS.map(({ label, slots }) => {
          const groupSlots = slots.filter((s) => availableSlots.includes(s as SlotType)) as SlotType[];
          const groupCustomSlots = build.slots.filter(
            (slot) => parseCustomSlot(slot.slotType)?.category === label
          );

          const hasVisiblePreset = isEditing
            ? groupSlots.length > 0
            : groupSlots.some((s) => !!slotMap[s]?.accessoryId);
          const hasVisibleCustom = isEditing
            ? groupCustomSlots.length > 0
            : groupCustomSlots.some((s) => !!s.accessoryId);
          const isAddingHere = addingSlotInGroup === label;

          if (!hasVisiblePreset && !hasVisibleCustom && !isEditing) return null;
          if (groupSlots.length === 0 && groupCustomSlots.length === 0 && !isEditing) return null;

          const displayPresetSlots = isEditing
            ? groupSlots
            : groupSlots.filter((slotType) => !!slotMap[slotType]?.accessoryId);

          return (
            <div key={label}>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-vault-text-faint mb-2 px-0.5 flex items-center gap-2">
                {label}
                <span className="flex-1 h-px bg-vault-border" />
              </p>
              <div className="grid grid-cols-2 gap-2">
                {displayPresetSlots.map((slotType) => {
                  const slot = slotMap[slotType];
                  const acc = slot?.accessory ?? null;
                  const slotIconConfig = SLOT_ICONS[slotType];
                  const SlotIcon = slotIconConfig?.icon ?? Shield;
                  const color = slotIconConfig?.color ?? "#8B9DB0";

                  if (acc) {
                    return (
                      <div
                        key={slotType}
                        className="relative bg-vault-surface rounded-lg overflow-hidden border transition-colors"
                        style={{ borderColor: `${color}22` }}
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />
                        <div className="pl-3 pr-2 py-2.5">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[9px] font-mono uppercase tracking-widest leading-none" style={{ color: `${color}75` }}>
                              {SLOT_TYPE_LABELS[slotType]}
                            </p>
                            <SlotIcon className="w-3 h-3 shrink-0" style={{ color: `${color}50` }} />
                          </div>
                          <p className="text-xs font-semibold text-vault-text truncate mt-1.5 leading-tight">{acc.name}</p>
                          {acc.roundCount > 0 && <p className="text-[9px] font-mono text-[#F5A623]/70 mt-0.5">{acc.roundCount.toLocaleString()} rds</p>}
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => onEditAccessory(acc)}
                              className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors"
                              title="Edit accessory"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            {isEditing && (
                              <>
                                <button
                                  onClick={() => onSlotClick(slotType)}
                                  className="text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => onRemoveSlot(slotType)}
                                  className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={slotType}
                      onClick={() => onSlotClick(slotType)}
                      className="group bg-vault-surface rounded-lg border border-vault-border hover:border-[#00C2FF]/25 hover:bg-[#00C2FF]/[0.03] transition-colors text-left p-2.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[9px] font-mono uppercase tracking-widest text-vault-border group-hover:text-vault-text-faint transition-colors leading-none">
                          {SLOT_TYPE_LABELS[slotType]}
                        </p>
                        <SlotIcon className="w-3 h-3 shrink-0 text-vault-border group-hover:text-vault-text-faint transition-colors" />
                      </div>
                      <p className="text-[10px] text-vault-border mt-1.5">Empty</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-[9px] text-vault-border group-hover:text-[#00C2FF] border border-vault-border group-hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors">
                        <Plus className="w-2 h-2" />
                        Attach
                      </span>
                    </button>
                  );
                })}

                {/* Custom slots for this group */}
                {groupCustomSlots
                  .filter((slot) => isEditing || !!slot.accessoryId)
                  .map((slot) => {
                    const acc = slot.accessory;
                    const customLabel = getCustomSlotLabel(slot.slotType) || "Custom Slot";

                    if (!acc) {
                      return (
                        <div
                          key={slot.id}
                          className="group bg-vault-surface rounded-lg border border-vault-border hover:border-[#00C2FF]/25 hover:bg-[#00C2FF]/[0.03] transition-colors text-left p-2.5"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[9px] font-mono uppercase tracking-widest text-vault-border group-hover:text-vault-text-faint transition-colors leading-none">{customLabel}</p>
                            <Shield className="w-3 h-3 shrink-0 text-vault-border group-hover:text-vault-text-faint transition-colors" />
                          </div>
                          <p className="text-[10px] text-vault-border mt-1.5">Empty</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => onSlotClick(slot.slotType)}
                              className="inline-flex items-center gap-1 text-[9px] text-vault-border hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors"
                              aria-label={`Attach accessory to ${customLabel}`}
                            >
                              <Plus className="w-2 h-2" />
                              Attach
                            </button>
                            {isEditing && (
                              <button
                                onClick={() => onDeleteCustomSlot(slot.slotType)}
                                className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                                title="Delete slot"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={slot.id} className="relative bg-vault-surface rounded-lg overflow-hidden border border-vault-border transition-colors">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C2FF]/70" />
                        <div className="pl-3 pr-2 py-2.5">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[9px] font-mono uppercase tracking-widest leading-none text-[#00C2FF]/80">{customLabel}</p>
                            <Shield className="w-3 h-3 shrink-0 text-[#00C2FF]/50" />
                          </div>
                          <p className="text-xs font-semibold text-vault-text truncate mt-1.5 leading-tight">{acc.name}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={() => onEditAccessory(acc)}
                              className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors"
                              title="Edit accessory"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            {isEditing && (
                              <>
                                <button
                                  onClick={() => onSlotClick(slot.slotType)}
                                  className="text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Change
                                </button>
                                <button
                                  onClick={() => onDeleteCustomSlot(slot.slotType)}
                                  className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                                  title="Delete slot"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Per-group "Add custom slot" in edit mode */}
              {isEditing && (
                <div className="mt-2">
                  {isAddingHere ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={customSlotInput}
                        onChange={(e) => onCustomSlotInputChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") onConfirmAddSlot(); if (e.key === "Escape") onCancelAddingSlot(); }}
                        placeholder={`Custom slot name in ${label}...`}
                        className={`${FIELD_CLASS} text-xs py-1.5`}
                        autoFocus
                      />
                      <button
                        onClick={onConfirmAddSlot}
                        className="shrink-0 px-2.5 py-1.5 text-xs text-[#00C2FF] border border-[#00C2FF]/30 rounded-md hover:bg-[#00C2FF]/10 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={onCancelAddingSlot}
                        className="shrink-0 px-2.5 py-1.5 text-xs text-vault-text-muted border border-vault-border rounded-md hover:bg-vault-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartAddingSlot(label)}
                      className="flex items-center gap-1 text-[9px] text-vault-text-faint hover:text-vault-text-muted border border-dashed border-vault-border hover:border-vault-text-muted/40 px-2 py-1 rounded transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Add custom slot
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Other Custom Slots (uncategorized or unknown category) */}
        {(isEditing || uncategorizedCustomSlots.some((slot) => slot.accessoryId)) && (
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-vault-text-faint mb-2 px-0.5 flex items-center gap-2">
              Other Custom Slots
              <span className="flex-1 h-px bg-vault-border" />
            </p>

            {isEditing && (
              <div className="flex items-center gap-2 mb-2">
                {addingSlotInGroup === null ? (
                  <>
                    <input
                      value={customSlotInput}
                      onChange={(e) => onCustomSlotInputChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") onConfirmAddSlot(); }}
                      placeholder="Add uncategorized custom slot"
                      className={FIELD_CLASS}
                    />
                    <button
                      onClick={onConfirmAddSlot}
                      className="shrink-0 px-3 py-2 text-xs text-[#00C2FF] border border-[#00C2FF]/30 rounded-md hover:bg-[#00C2FF]/10 transition-colors"
                    >
                      Add Slot
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onStartAddingSlot(null)}
                    className="flex items-center gap-1 text-[9px] text-vault-text-faint hover:text-vault-text-muted border border-dashed border-vault-border hover:border-vault-text-muted/40 px-2 py-1 rounded transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Add uncategorized slot
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {uncategorizedCustomSlots
                .filter((slot) => isEditing || !!slot.accessoryId)
                .map((slot) => {
                  const acc = slot.accessory;
                  const customLabel = getCustomSlotLabel(slot.slotType) || "Custom Slot";

                  if (!acc) {
                    return (
                      <div
                        key={slot.id}
                        className="group bg-vault-surface rounded-lg border border-vault-border hover:border-[#00C2FF]/25 hover:bg-[#00C2FF]/[0.03] transition-colors text-left p-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-[9px] font-mono uppercase tracking-widest text-vault-border group-hover:text-vault-text-faint transition-colors leading-none">{customLabel}</p>
                          <Shield className="w-3 h-3 shrink-0 text-vault-border group-hover:text-vault-text-faint transition-colors" />
                        </div>
                        <p className="text-[10px] text-vault-border mt-1.5">Empty</p>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => onSlotClick(slot.slotType)}
                            className="inline-flex items-center gap-1 text-[9px] text-vault-border hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors"
                            aria-label={`Attach accessory to ${customLabel}`}
                          >
                            <Plus className="w-2 h-2" />
                            Attach
                          </button>
                          {isEditing && (
                            <button
                              onClick={() => onDeleteCustomSlot(slot.slotType)}
                              className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                              title="Delete slot"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={slot.id} className="relative bg-vault-surface rounded-lg overflow-hidden border border-vault-border transition-colors">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C2FF]/70" />
                      <div className="pl-3 pr-2 py-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-[9px] font-mono uppercase tracking-widest leading-none text-[#00C2FF]/80">{customLabel}</p>
                          <Shield className="w-3 h-3 shrink-0 text-[#00C2FF]/50" />
                        </div>
                        <p className="text-xs font-semibold text-vault-text truncate mt-1.5 leading-tight">{acc.name}</p>
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => onEditAccessory(acc)}
                            className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#00C2FF] hover:bg-[#00C2FF]/10 rounded transition-colors"
                            title="Edit accessory"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                          {isEditing && (
                            <>
                              <button
                                onClick={() => onSlotClick(slot.slotType)}
                                className="text-[9px] text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 px-1.5 py-0.5 rounded transition-colors"
                              >
                                Change
                              </button>
                              <button
                                onClick={() => onDeleteCustomSlot(slot.slotType)}
                                className="w-5 h-5 flex items-center justify-center text-vault-text-muted hover:text-[#E53935] hover:bg-[#E53935]/10 rounded transition-colors"
                                title="Delete slot"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Main Configurator Page ────────────────────────────────────

export default function BuildConfiguratorPage() {
  const params = useParams<{ id: string; buildId: string }>();
  const router = useRouter();
  const firearmId = params.id;
  const buildId = params.buildId;

  const [build, setBuild] = useState<Build | null>(null);
  const [allBuilds, setAllBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activatingBuild, setActivatingBuild] = useState(false);

  const [browserSlot, setBrowserSlot] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addingSlotInGroup, setAddingSlotInGroup] = useState<string | null>(null);
  const [customSlotInput, setCustomSlotInput] = useState("");
  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [localBuildImageUrl, setLocalBuildImageUrl] = useState<string | null>(null);

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
        setLocalBuildImageUrl(buildData.imageUrl ?? null);
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

  async function parseErrorMessage(res: Response, fallback: string) {
    try {
      const data = await res.json();
      return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
    } catch {
      return fallback;
    }
  }

  async function handleRemoveSlot(slotType: string) {
    if (!build) return;
    try {
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId: null }),
      });

      if (!res.ok) {
        const fallback = res.status === 409
          ? "Slot could not be updated because of a conflict. Please refresh and try again."
          : "Failed to remove slot accessory.";
        setActionError(await parseErrorMessage(res, fallback));
        return;
      }

      setActionError(null);
      await fetchBuild();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to remove slot accessory", err);
      }
      setActionError("Unable to remove slot accessory right now. Please try again.");
    }
  }


  async function handleAddCustomSlot() {
    const name = customSlotInput.trim();
    if (!name) return;

    try {
      const slotType = addingSlotInGroup
        ? `CUSTOM:${addingSlotInGroup}|${name}`
        : `CUSTOM:${name}`;
      const res = await fetch(`/api/builds/${buildId}/slots`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotType, accessoryId: null }),
      });

      if (!res.ok) {
        const fallback = res.status === 409
          ? "A slot with that name already exists in this section."
          : "Failed to add custom slot.";
        setActionError(await parseErrorMessage(res, fallback));
        return;
      }

      setCustomSlotInput("");
      setAddingSlotInGroup(null);
      setActionError(null);
      await fetchBuild();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to add custom slot", err);
      }
      setActionError("Unable to add custom slot right now. Please try again.");
    }
  }

  async function handleDeleteCustomSlot(slotType: string) {
    try {
      const res = await fetch(`/api/builds/${buildId}/slots?slotType=${encodeURIComponent(slotType)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const fallback = res.status === 409
          ? "This slot cannot be deleted right now because of a conflict."
          : "Failed to delete custom slot.";
        setActionError(await parseErrorMessage(res, fallback));
        return;
      }

      setActionError(null);
      await fetchBuild();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to delete custom slot", err);
      }
      setActionError("Unable to delete custom slot right now. Please try again.");
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
        setActionError(await parseErrorMessage(res, "Failed to activate build."));
        return;
      }

      setActionError(null);
      await fetchBuild();
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to activate build", err);
      }
      setActionError("Unable to activate build right now. Please try again.");
    }
    finally { setActivatingBuild(false); }
  }

  function handleSwitchBuild(newBuildId: string) {
    router.push(`/vault/${firearmId}/builds/${newBuildId}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas">
        <Loader2 className="w-10 h-10 text-[#00C2FF] animate-spin mb-4" />
        <p className="text-sm text-vault-text-muted font-mono uppercase tracking-widest">Loading Configurator...</p>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-vault-canvas gap-4">
        <AlertCircle className="w-12 h-12 text-[#E53935]" />
        <p className="text-[#E53935]">{error ?? "Build not found"}</p>
        <Link href={`/vault/${firearmId}`} className="text-sm text-[#00C2FF] hover:underline">Back to Firearm</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-vault-canvas overflow-y-auto">
      {/* Thin header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-vault-border bg-vault-bg shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link href={`/vault/${firearmId}`}
            className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-xs transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{build.firearm.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <span className="text-vault-border text-xs">/</span>
          <span className="text-xs text-vault-text font-medium">{build.name}</span>
          {build.isActive && (
            <span className="flex items-center gap-1 text-[9px] font-mono text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded uppercase">
              <CheckCircle2 className="w-2.5 h-2.5" />Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-mono text-vault-text-faint border border-vault-border px-2 py-0.5 rounded uppercase">
            {build.firearm.type}
          </span>
          <button
            onClick={() => setPhotoModalOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-vault-border text-vault-text-faint hover:text-[#00C2FF] hover:border-[#00C2FF]/40 transition-colors"
            title="Manage build photos"
          >
            <Camera className="w-3 h-3" />
            Photos
          </button>
          <button
            onClick={() => setIsEditing((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors ${isEditing ? "border-[#00C2FF]/50 text-[#00C2FF] bg-[#00C2FF]/10" : "border-vault-border text-vault-text-faint hover:text-vault-text"}`}
          >
            <Pencil className="w-3 h-3" />
            {isEditing ? "Done" : "Edit Loadout"}
          </button>
          {!build.isActive ? (
            <button onClick={handleActivate} disabled={activatingBuild}
              className="flex items-center gap-1.5 text-xs bg-[#00C853]/10 border border-[#00C853]/40 text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-50 px-3 py-1.5 rounded transition-colors">
              {activatingBuild ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Activate Build
            </button>
          ) : (
            <span className="text-xs text-vault-text-faint px-3 py-1.5 border border-vault-border rounded">Build Active</span>
          )}
        </div>
      </div>

      {actionError && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
          <p className="text-xs text-[#E53935]">{actionError}</p>
        </div>
      )}

      {/* Loadout layout */}
      <GunBanner build={build} />
      <LoadoutGrid
        build={build}
        allBuilds={allBuilds}
        isEditing={isEditing}
        addingSlotInGroup={addingSlotInGroup}
        customSlotInput={customSlotInput}
        onStartAddingSlot={setAddingSlotInGroup}
        onCustomSlotInputChange={setCustomSlotInput}
        onConfirmAddSlot={handleAddCustomSlot}
        onCancelAddingSlot={() => { setAddingSlotInGroup(null); setCustomSlotInput(""); }}
        onDeleteCustomSlot={handleDeleteCustomSlot}
        onSlotClick={(slotType) => setBrowserSlot(slotType)}
        onRemoveSlot={handleRemoveSlot}
        onSwitchBuild={handleSwitchBuild}
        onEditAccessory={(acc) => setEditingAccessory(acc)}
      />

      {/* Accessory Browser Modal */}
      {browserSlot && (
        <AccessoryBrowserModal
          slotType={browserSlot}
          buildId={buildId}
          onClose={() => setBrowserSlot(null)}
          onAssigned={() => { setBrowserSlot(null); fetchBuild(); }}
        />
      )}

      {/* Accessory Edit Modal */}
      {editingAccessory && (
        <AccessoryEditModal
          accessory={editingAccessory}
          onClose={() => setEditingAccessory(null)}
          onSaved={() => { setEditingAccessory(null); fetchBuild(); }}
        />
      )}

      {/* Build Photo Modal */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(5,7,9,0.85)" }}>
          <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-vault-border">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00C2FF]" />
                <h2 className="text-sm font-semibold text-vault-text">Build Photos</h2>
              </div>
              <button onClick={() => setPhotoModalOpen(false)} className="text-vault-text-faint hover:text-vault-text transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <PhotoGallery
                entityType="build"
                entityId={buildId}
                onPrimaryChange={(url) => setLocalBuildImageUrl(url)}
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
    </div>
  );
}
