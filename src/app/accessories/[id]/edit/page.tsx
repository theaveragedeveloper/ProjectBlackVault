"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SLOT_TYPES, SLOT_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import ImagePicker from "@/components/shared/ImagePicker";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  serialNumber: string | null;
  type: string;
  caliber: string | null;
  acquisitionDate: string | null;
  purchasePrice: number | null;
  notes: string | null;
  imageUrl: string | null;
  hasBattery: boolean;
  batteryType: string | null;
  lastBatteryChangeDate: string | null;
  replacementIntervalDays: number | null;
  roundCount: number;
}

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function EditAccessoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const accessoryId = Array.isArray(params.id) ? params.id[0] : params.id;
  const invalidRoute = !accessoryId;

  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [dataLoading, setDataLoading] = useState(!invalidRoute);
  const [dataError, setDataError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [priorRounds, setPriorRounds] = useState("");
  const [priorRoundsNote, setPriorRoundsNote] = useState("");

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  useEffect(() => {
    if (!accessoryId) return;

    fetch(`/api/accessories/${accessoryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setAccessory(data);
          setCaliberInput(data.caliber ?? "");
          setImageUrl(data.imageUrl ?? "");
        }
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Failed to load accessory");
        setDataLoading(false);
      });
  }, [accessoryId]);

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
      model: (data.get("model") as string) || null,
      serialNumber: (data.get("serialNumber") as string) || null,
      type: data.get("type") as string,
      caliber: caliberInput || null,
      acquisitionDate: (data.get("acquisitionDate") as string) || null,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: imageUrl || null,
      imageSource: imageUrl ? "uploaded" : null,
      hasBattery: data.get("hasBattery") === "on",
      batteryType: (data.get("batteryType") as string) || null,
      lastBatteryChangeDate: (data.get("lastBatteryChangeDate") as string) || null,
      replacementIntervalDays: data.get("replacementIntervalDays") ? Number(data.get("replacementIntervalDays")) : null,
    };

    try {
      const res = await fetch(`/api/accessories/${accessoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to update accessory");
        setLoading(false);
        return;
      }

      // Log prior round count if provided (only allowed when current count is 0)
      const priorRoundsNum = parseInt(priorRounds);
      if (priorRoundsNum > 0) {
        await fetch(`/api/accessories/${accessoryId}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rounds: priorRoundsNum,
            note: priorRoundsNote || "Prior use at time of entry",
          }),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/accessories/${accessoryId}`);
      }, 800);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
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
        <p className="text-[#E53935]">Invalid accessory route.</p>
        <Link href="/accessories" className="text-sm text-[#00C2FF] hover:underline">
          Back to Accessories
        </Link>
      </div>
    );
  }

  if (dataError || !accessory) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">{dataError ?? "Accessory not found"}</p>
        <Link href="/accessories" className="text-sm text-[#00C2FF] hover:underline">
          Back to Accessories
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-vault-border flex-wrap">
        <Link
          href={`/accessories/${accessoryId}`}
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {accessory.name}
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          Edit Accessory
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-vault-text mb-1">Edit {accessory.name}</h2>
          <p className="text-sm text-vault-text-muted">Update the details for this accessory.</p>
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
                Accessory Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={accessory.name}
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
                  defaultValue={accessory.manufacturer}
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
                  defaultValue={accessory.model ?? ""}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label htmlFor="serialNumber" className={LABEL_CLASS}>
                Serial Number
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                defaultValue={accessory.serialNumber ?? ""}
                placeholder="e.g. SN-12345 (optional)"
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label htmlFor="type" className={LABEL_CLASS}>
                  Type / Slot
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={accessory.type}
                  className={INPUT_CLASS}
                >
                  <option value="">Select slot type...</option>
                  {SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SLOT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caliber */}
              <div>
                <label className={LABEL_CLASS}>Caliber</label>
                <div className="relative">
                  <input
                    type="text"
                    value={caliberInput}
                    onChange={(e) => {
                      setCaliberInput(e.target.value);
                      setCaliberDropdownOpen(true);
                    }}
                    onFocus={() => setCaliberDropdownOpen(true)}
                    onBlur={() => setCaliberDropdownOpen(false)}
                    placeholder="e.g. 5.56x45mm"
                    className={INPUT_CLASS}
                  />
                  {caliberDropdownOpen && filteredCalibers.length > 0 && caliberInput && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-vault-surface border border-vault-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredCalibers.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onPointerDown={(e) => e.preventDefault()}
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
            </div>
          </fieldset>

          {/* Acquisition */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Acquisition
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="acquisitionDate" className={LABEL_CLASS}>
                  Date Acquired
                </label>
                <input
                  id="acquisitionDate"
                  name="acquisitionDate"
                  type="date"
                  defaultValue={toDateInputValue(accessory.acquisitionDate)}
                  className={INPUT_CLASS}
                />
              </div>
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
                    defaultValue={accessory.purchasePrice ?? ""}
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
            </div>
          </fieldset>



          {/* Prior Use — only show if no rounds logged yet */}
          {accessory.roundCount === 0 && (
            <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
              <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
                Prior Use
              </legend>
              <p className="text-xs text-vault-text-muted">
                If this accessory has rounds from prior use, enter them here to set a baseline round count.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Round Count from Prior Use</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={priorRounds}
                    onChange={(e) => setPriorRounds(e.target.value)}
                    placeholder="e.g. 500"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Note (optional)</label>
                  <input
                    type="text"
                    value={priorRoundsNote}
                    onChange={(e) => setPriorRoundsNote(e.target.value)}
                    placeholder="e.g. Previous owner"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Battery Tracking */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Battery Tracking
            </legend>

            <label className="flex items-center gap-2 text-sm text-vault-text">
              <input id="hasBattery" name="hasBattery" type="checkbox" defaultChecked={accessory.hasBattery} className="rounded border-vault-border" />
              This accessory uses a battery
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="batteryType" className={LABEL_CLASS}>Battery Type</label>
                <input id="batteryType" name="batteryType" type="text" defaultValue={accessory.batteryType ?? ""} placeholder="e.g. CR2032" className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="replacementIntervalDays" className={LABEL_CLASS}>Replacement Interval (days)</label>
                <input id="replacementIntervalDays" name="replacementIntervalDays" type="number" min="1" step="1" defaultValue={accessory.replacementIntervalDays ?? ""} placeholder="e.g. 180" className={INPUT_CLASS} />
              </div>
            </div>

            <div>
              <label htmlFor="lastBatteryChangeDate" className={LABEL_CLASS}>Last Battery Change</label>
              <input id="lastBatteryChangeDate" name="lastBatteryChangeDate" type="date" defaultValue={toDateInputValue(accessory.lastBatteryChangeDate)} className={INPUT_CLASS} />
            </div>
          </fieldset>

          {/* Image */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Image
            </legend>
            <ImagePicker entityType="accessory" value={imageUrl} onChange={setImageUrl} />
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
                defaultValue={accessory.notes ?? ""}
                placeholder="Any additional notes about this accessory..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link
              href={`/accessories/${accessoryId}`}
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
      </div>
    </div>
  );
}
