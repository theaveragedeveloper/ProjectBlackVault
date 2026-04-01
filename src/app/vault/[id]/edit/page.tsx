"use client";

import { useEffect, useRef, useState } from "react";
import ImagePicker from "@/components/shared/ImagePicker";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FIREARM_TYPES, FIREARM_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import { ArrowLeft, Save, Loader2, AlertCircle, Trash2 } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface BuildSlot {
  accessory: { id: string } | null;
}

interface Build {
  id: string;
  name: string;
  slots: BuildSlot[];
}

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  caliber: string;
  compatibleCalibers: string | null;
  serialNumber: string;
  type: string;
  acquisitionDate: string;
  purchasePrice: number | null;
  currentValue: number | null;
  notes: string | null;
  imageUrl: string | null;
  lastMaintenanceDate: string | null;
  maintenanceIntervalDays: number | null;
  builds: Build[];
  rangeSessionCount: number;
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EditFirearmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const firearmId = Array.isArray(params.id) ? params.id[0] : params.id;
  const invalidRoute = !firearmId;

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [dataLoading, setDataLoading] = useState(!invalidRoute);
  const [dataError, setDataError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);
  const [compatCaliberTags, setCompatCaliberTags] = useState<string[]>([]);
  const [compatCaliberInput, setCompatCaliberInput] = useState("");
  const [compatCaliberDropdownOpen, setCompatCaliberDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const caliberRef = useRef<HTMLDivElement>(null);

  // Delete firearm state
  const [showDeleteFirearmModal, setShowDeleteFirearmModal] = useState(false);
  const [deleteFirearmAccessories, setDeleteFirearmAccessories] = useState<"keep" | "delete">("keep");
  const [deletingFirearm, setDeletingFirearm] = useState(false);

  // Delete build state
  const [deleteBuildTarget, setDeleteBuildTarget] = useState<{ id: string; name: string; accessoryCount: number } | null>(null);
  const [deleteBuildAccessories, setDeleteBuildAccessories] = useState<"keep" | "delete">("keep");
  const [deletingBuild, setDeletingBuild] = useState(false);

  const [deleteFirearmError, setDeleteFirearmError] = useState<string | null>(null);
  const [deleteBuildError, setDeleteBuildError] = useState<string | null>(null);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  useEffect(() => {
    if (!firearmId) return;

    fetch(`/api/firearms/${firearmId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setFirearm(data);
          setCaliberInput(data.caliber ?? "");
          setCompatCaliberTags(
            data.compatibleCalibers
              ? data.compatibleCalibers.split(",").map((s: string) => s.trim()).filter(Boolean)
              : []
          );
          setImageUrl(data.imageUrl ?? "");
        }
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Failed to load firearm");
        setDataLoading(false);
      });
  }, [firearmId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get("name") as string,
      manufacturer: data.get("manufacturer") as string,
      model: data.get("model") as string,
      caliber: caliberInput,
      compatibleCalibers: compatCaliberTags.length > 0 ? compatCaliberTags.join(",") : null,
      serialNumber: data.get("serialNumber") as string,
      type: data.get("type") as string,
      acquisitionDate: data.get("acquisitionDate") as string,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      currentValue: data.get("currentValue") ? Number(data.get("currentValue")) : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: imageUrl || null,
      imageSource: imageUrl ? "uploaded" : null,
      lastMaintenanceDate: (data.get("lastMaintenanceDate") as string) || null,
      maintenanceIntervalDays: data.get("maintenanceIntervalDays") ? Number(data.get("maintenanceIntervalDays")) : null,
    };

    try {
      const res = await fetch(`/api/firearms/${firearmId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to update firearm");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/vault/${firearmId}`);
      }, 800);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleDeleteFirearm() {
    if (!firearm) return;
    setDeleteFirearmError(null);
    setDeletingFirearm(true);
    try {
      const res = await fetch(`/api/firearms/${firearm.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAccessories: deleteFirearmAccessories === "delete" }),
      });
      if (res.ok) {
        router.push("/vault");
      } else {
        setDeleteFirearmError("Failed to delete. Please try again.");
        setDeletingFirearm(false);
      }
    } catch {
      setDeleteFirearmError("Failed to delete. Please try again.");
      setDeletingFirearm(false);
    }
  }

  async function handleDeleteBuild(buildId: string) {
    setDeleteBuildError(null);
    setDeletingBuild(true);
    try {
      const res = await fetch(`/api/builds/${buildId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAccessories: deleteBuildAccessories === "delete" }),
      });
      if (res.ok) {
        setFirearm((prev) => prev ? { ...prev, builds: prev.builds.filter((b) => b.id !== buildId) } : prev);
        setDeleteBuildTarget(null);
        setDeleteBuildAccessories("keep");
        setDeleteBuildError(null);
      } else {
        setDeleteBuildError("Failed to delete. Please try again.");
      }
    } finally {
      setDeletingBuild(false);
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (invalidRoute) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">Invalid firearm route.</p>
        <Link href="/vault" className="text-sm text-[#00C2FF] hover:underline">
          Back to Vault
        </Link>
      </div>
    );
  }

  if (dataError || !firearm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">{dataError ?? "Firearm not found"}</p>
        <Link href="/vault" className="text-sm text-[#00C2FF] hover:underline">
          Back to Vault
        </Link>
      </div>
    );
  }

  const totalAccessoryCount = firearm.builds.reduce(
    (sum, b) => sum + b.slots.filter((s) => s.accessory).length,
    0
  );

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-vault-border flex-wrap">
        <Link
          href={`/vault/${firearmId}`}
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {firearm.name}
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          Edit Firearm
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-vault-text mb-1">Edit {firearm.name}</h2>
          <p className="text-sm text-vault-text-muted">Update the details for this firearm.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-[#00C853]/10 border border-[#00C853]/30 rounded-lg px-4 py-3 mb-6">
            <Save className="w-4 h-4 text-[#00C853] shrink-0" />
            <p className="text-sm text-[#00C853]">Saved! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Identity
            </legend>

            <div>
              <label htmlFor="name" className={LABEL_CLASS}>
                Firearm Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={firearm.name}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="manufacturer" className={LABEL_CLASS}>
                  Manufacturer
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  defaultValue={firearm.manufacturer}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="model" className={LABEL_CLASS}>
                  Model
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  defaultValue={firearm.model}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Caliber Combobox */}
              <div>
                <label className={LABEL_CLASS}>
                  Caliber
                </label>
                <div className="relative" ref={caliberRef}>
                  <input
                    type="text"
                    value={caliberInput}
                    onChange={(e) => {
                      setCaliberInput(e.target.value);
                      setCaliberDropdownOpen(true);
                    }}
                    onFocus={() => setCaliberDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCaliberDropdownOpen(false), 150)}
                    placeholder="e.g. 9mm Luger"
                    className={INPUT_CLASS}
                  />
                  {caliberDropdownOpen && filteredCalibers.length > 0 && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-vault-surface border border-vault-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredCalibers.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCaliberInput(c);
                            setCaliberDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-vault-text hover:bg-vault-border hover:text-[#00C2FF] transition-colors font-mono"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className={LABEL_CLASS}>
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={firearm.type}
                  className={INPUT_CLASS}
                >
                  <option value="">Select type...</option>
                  {FIREARM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {FIREARM_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Compatible Calibers Tag Input */}
            <div>
              <label className={LABEL_CLASS}>
                Compatible Calibers
              </label>
              {compatCaliberTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {compatCaliberTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-xs font-mono rounded px-2 py-0.5"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setCompatCaliberTags((prev) => prev.filter((t) => t !== tag))}
                        className="hover:text-white transition-colors ml-0.5"
                        aria-label={`Remove ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  value={compatCaliberInput}
                  onChange={(e) => {
                    setCompatCaliberInput(e.target.value);
                    setCompatCaliberDropdownOpen(true);
                  }}
                  onFocus={() => setCompatCaliberDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setCompatCaliberDropdownOpen(false), 150)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && compatCaliberInput === "") {
                      e.preventDefault();
                      setCompatCaliberTags(prev => prev.slice(0, -1));
                      return;
                    }
                    if ((e.key === "Enter" || e.key === ",") && compatCaliberInput.trim()) {
                      e.preventDefault();
                      const val = compatCaliberInput.trim().replace(/,$/, "");
                      if (val && !compatCaliberTags.includes(val)) {
                        setCompatCaliberTags((prev) => [...prev, val]);
                      }
                      setCompatCaliberInput("");
                      setCompatCaliberDropdownOpen(false);
                    }
                  }}
                  placeholder="e.g. .223 Rem (press Enter to add)"
                  className={INPUT_CLASS}
                />
                {compatCaliberDropdownOpen && compatCaliberInput.trim() !== "" && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-vault-surface border border-vault-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {COMMON_CALIBERS.filter(
                      (c) =>
                        c.toLowerCase().includes(compatCaliberInput.toLowerCase()) &&
                        !compatCaliberTags.includes(c)
                    ).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          if (!compatCaliberTags.includes(c)) {
                            setCompatCaliberTags((prev) => [...prev, c]);
                          }
                          setCompatCaliberInput("");
                          setCompatCaliberDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-vault-text hover:bg-vault-border hover:text-[#00C2FF] transition-colors font-mono"
                      >
                        {c}
                      </button>
                    ))}
                    {!COMMON_CALIBERS.some((c) => c.toLowerCase() === compatCaliberInput.toLowerCase().trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          const val = compatCaliberInput.trim();
                          if (val && !compatCaliberTags.includes(val)) {
                            setCompatCaliberTags((prev) => [...prev, val]);
                          }
                          setCompatCaliberInput("");
                          setCompatCaliberDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-[#00C2FF] hover:bg-vault-border transition-colors font-mono border-t border-vault-border"
                      >
                        + Use &quot;{compatCaliberInput.trim()}&quot;
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-vault-text-faint mt-1">Other calibers this firearm can safely fire. Optional.</p>
            </div>

            <div>
              <label htmlFor="serialNumber" className={LABEL_CLASS}>
                Serial Number
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                defaultValue={firearm.serialNumber}
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </fieldset>

          {/* Acquisition */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Acquisition
            </legend>

            <div>
              <label htmlFor="acquisitionDate" className={LABEL_CLASS}>
                Date Acquired
              </label>
              <input
                id="acquisitionDate"
                name="acquisitionDate"
                type="date"
                defaultValue={toDateInputValue(firearm.acquisitionDate)}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchasePrice" className={LABEL_CLASS}>
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">
                    $
                  </span>
                  <input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={firearm.purchasePrice ?? ""}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="currentValue" className={LABEL_CLASS}>
                  Current Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">
                    $
                  </span>
                  <input
                    id="currentValue"
                    name="currentValue"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={firearm.currentValue ?? ""}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Maintenance */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Maintenance
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastMaintenanceDate" className={LABEL_CLASS}>Last Maintenance</label>
                <input id="lastMaintenanceDate" name="lastMaintenanceDate" type="date" defaultValue={toDateInputValue(firearm.lastMaintenanceDate)} className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="maintenanceIntervalDays" className={LABEL_CLASS}>Maintenance Interval (days)</label>
                <input id="maintenanceIntervalDays" name="maintenanceIntervalDays" type="number" min="1" step="1" defaultValue={firearm.maintenanceIntervalDays ?? ""} placeholder="e.g. 180" className={INPUT_CLASS} />
              </div>
            </div>
          </fieldset>

          {/* Image */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Image
            </legend>
            <ImagePicker entityType="firearm" value={imageUrl} onChange={setImageUrl} />
          </fieldset>

          {/* Notes */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Notes
            </legend>
            <div>
              <label htmlFor="notes" className={LABEL_CLASS}>
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={firearm.notes ?? ""}
                placeholder="Any additional notes..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link
              href={`/vault/${firearmId}`}
              className="w-full sm:w-auto text-center px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md hover:border-vault-text-muted/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : success ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Builds section */}
        <div className="mt-8 border-t border-vault-border pt-6">
          <h3 className="text-xs font-mono uppercase tracking-widest text-vault-text-muted mb-3">Builds</h3>
          {firearm.builds.length === 0 ? (
            <p className="text-sm text-vault-text-faint">No builds</p>
          ) : (
            <div className="space-y-2">
              {firearm.builds.map((build) => {
                const accCount = build.slots.filter((s) => s.accessory).length;
                return (
                  <div
                    key={build.id}
                    className="flex items-center justify-between bg-vault-surface border border-vault-border rounded-md px-4 py-2.5"
                  >
                    <span className="text-sm text-vault-text">{build.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteBuildTarget({ id: build.id, name: build.name, accessoryCount: accCount });
                        setDeleteBuildAccessories("keep");
                      }}
                      className="text-vault-text-muted hover:text-[#E53935] transition-colors p-1"
                      aria-label={`Delete build ${build.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Firearm section */}
        <div className="mt-6 border-t border-vault-border pt-6">
          <button
            type="button"
            onClick={() => setShowDeleteFirearmModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E53935]/40 text-[#E53935] rounded-md hover:bg-[#E53935]/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Firearm
          </button>
        </div>
      </div>

      {/* Delete Firearm Modal */}
      {showDeleteFirearmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-vault-surface border border-vault-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#E53935]/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-[#E53935]" />
              </div>
              <h2 className="text-base font-semibold text-vault-text">Delete Firearm</h2>
            </div>

            {(firearm.builds.length > 0 || totalAccessoryCount > 0) && (
              <p className="text-sm text-vault-text-muted mb-4">
                This firearm has{" "}
                <span className="text-vault-text font-medium">{firearm.builds.length} build{firearm.builds.length !== 1 ? "s" : ""}</span>
                {totalAccessoryCount > 0 && (
                  <> and{" "}
                    <span className="text-vault-text font-medium">{totalAccessoryCount} accessor{totalAccessoryCount !== 1 ? "ies" : "y"}</span>
                  </>
                )}.
              </p>
            )}

            {firearm.rangeSessionCount > 0 && (
              <p className="text-sm text-[#E53935]/80 mb-4">
                This will also delete{" "}
                <span className="font-medium">{firearm.rangeSessionCount} range session{firearm.rangeSessionCount !== 1 ? "s" : ""}</span> for this firearm.
              </p>
            )}

            {(firearm.builds.length > 0 || totalAccessoryCount > 0) ? (
              <div className="space-y-2 mb-5">
                <p className="text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-2">What should happen to the accessories?</p>
                {[
                  { value: "keep", label: "Keep accessories in vault" },
                  { value: "delete", label: "Delete accessories too" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteFirearmAccessories"
                      value={opt.value}
                      checked={deleteFirearmAccessories === opt.value}
                      onChange={() => setDeleteFirearmAccessories(opt.value as "keep" | "delete")}
                      className="accent-[#00C2FF]"
                    />
                    <span className="text-sm text-vault-text">{opt.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-vault-text-muted mb-5">This cannot be undone.</p>
            )}

            {deleteFirearmError && (
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-2">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{deleteFirearmError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteFirearmModal(false)}
                disabled={deletingFirearm}
                className="flex-1 px-4 py-2 text-sm text-vault-text-muted border border-vault-border rounded-md hover:border-vault-text-muted/40 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFirearm}
                disabled={deletingFirearm}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#E53935]/10 border border-[#E53935]/40 text-[#E53935] rounded-md hover:bg-[#E53935]/20 transition-colors disabled:opacity-50"
              >
                {deletingFirearm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingFirearm ? "Deleting..." : "Delete Firearm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Build Modal */}
      {deleteBuildTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-vault-surface border border-vault-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[#E53935]/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-[#E53935]" />
              </div>
              <h2 className="text-base font-semibold text-vault-text">Delete Build</h2>
            </div>

            {deleteBuildTarget.accessoryCount > 0 ? (
              <>
                <p className="text-sm text-vault-text-muted mb-4">
                  <span className="text-vault-text font-medium">{deleteBuildTarget.name}</span> has{" "}
                  <span className="text-vault-text font-medium">{deleteBuildTarget.accessoryCount} accessor{deleteBuildTarget.accessoryCount !== 1 ? "ies" : "y"}</span>.
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
                        name="deleteBuildAccessories"
                        value={opt.value}
                        checked={deleteBuildAccessories === opt.value}
                        onChange={() => setDeleteBuildAccessories(opt.value as "keep" | "delete")}
                        className="accent-[#00C2FF]"
                      />
                      <span className="text-sm text-vault-text">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-vault-text-muted mb-5">
                Delete <span className="text-vault-text font-medium">{deleteBuildTarget.name}</span>? This cannot be undone.
              </p>
            )}

            {deleteBuildError && (
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-2">
                <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{deleteBuildError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDeleteBuildTarget(null); setDeleteBuildAccessories("keep"); }}
                disabled={deletingBuild}
                className="flex-1 px-4 py-2 text-sm text-vault-text-muted border border-vault-border rounded-md hover:border-vault-text-muted/40 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBuild(deleteBuildTarget.id)}
                disabled={deletingBuild}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#E53935]/10 border border-[#E53935]/40 text-[#E53935] rounded-md hover:bg-[#E53935]/20 transition-colors disabled:opacity-50"
              >
                {deletingBuild ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingBuild ? "Deleting..." : "Delete Build"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
