"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SLOT_TYPES, SLOT_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import ImagePicker from "@/components/shared/ImagePicker";
import { HelpTip } from "@/components/shared/HelpTip";
import { ArrowLeft, Plus, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export default function NewAccessoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const parsedPurchasePrice = Number(data.get("purchasePrice"));
    const parsedReplacementInterval = Number(data.get("replacementIntervalDays"));
    const payload = {
      name: data.get("name") as string,
      manufacturer: data.get("manufacturer") as string,
      model: (data.get("model") as string) || null,
      type: data.get("type") as string,
      caliber: caliberInput || null,
      acquisitionDate: (data.get("acquisitionDate") as string) || null,
      purchasePrice: Number.isFinite(parsedPurchasePrice) && parsedPurchasePrice >= 0 ? parsedPurchasePrice : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: imageUrl || null,
      imageSource: imageUrl ? "uploaded" : null,
      hasBattery: data.get("hasBattery") === "on",
      batteryType: (data.get("batteryType") as string) || null,
      lastBatteryChangeDate: (data.get("lastBatteryChangeDate") as string) || null,
      replacementIntervalDays:
        Number.isFinite(parsedReplacementInterval) && parsedReplacementInterval > 0
          ? parsedReplacementInterval
          : null,
    };

    try {
      const res = await fetch("/api/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create accessory");
        setLoading(false);
        return;
      }

      router.push(`/accessories/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      {/* Breadcrumb header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-4 sm:px-6 py-4 border-b border-vault-border">
        <Link
          href="/accessories"
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accessories
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          Add Accessory
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-vault-text mb-1">New Accessory Entry</h2>
          <p className="text-sm text-vault-text-muted">Register a new part or attachment in the arsenal.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
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
                placeholder="e.g. Trijicon ACOG 4x32"
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
                  placeholder="e.g. Trijicon"
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
                  placeholder="e.g. TA31RCO-M150CP"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className={LABEL_CLASS}>
                  Type / Slot
                </label>
                <select id="type" name="type" className={INPUT_CLASS}>
                  <option value="">Select slot type...</option>
                  {SLOT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SLOT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caliber (optional) */}
              <div>
                <label className={LABEL_CLASS}>
                  Caliber
                  <HelpTip text="Calibers this accessory works with. Used to filter compatible accessories when building a loadout." />
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={caliberInput}
                    onChange={(e) => {
                      setCaliberInput(e.target.value);
                      setCaliberDropdownOpen(true);
                    }}
                    onFocus={() => setCaliberDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCaliberDropdownOpen(false), 150)}
                    placeholder="e.g. 5.56x45mm"
                    className={INPUT_CLASS}
                  />
                  {caliberDropdownOpen && filteredCalibers.length > 0 && caliberInput && (
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
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="purchasePrice" className={LABEL_CLASS}>
                  Purchase Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">$</span>
                  <input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
              </div>
            </div>
          </fieldset>



          {/* Battery Tracking */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Battery Tracking
            </legend>

            <label className="flex items-center gap-2 text-sm text-vault-text">
              <input id="hasBattery" name="hasBattery" type="checkbox" className="rounded border-vault-border" />
              This accessory uses a battery
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="batteryType" className={LABEL_CLASS}>Battery Type</label>
                <input id="batteryType" name="batteryType" type="text" placeholder="e.g. CR2032" className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="replacementIntervalDays" className={LABEL_CLASS}>Replacement Interval (days)</label>
                <input id="replacementIntervalDays" name="replacementIntervalDays" type="number" min="1" step="1" placeholder="e.g. 180" className={INPUT_CLASS} />
              </div>
            </div>

            <div>
              <label htmlFor="lastBatteryChangeDate" className={LABEL_CLASS}>Last Battery Change</label>
              <input id="lastBatteryChangeDate" name="lastBatteryChangeDate" type="date" className={INPUT_CLASS} />
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
                placeholder="Any additional notes about this accessory..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link
              href="/accessories"
              className="w-full sm:w-auto text-center px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md hover:border-vault-text-muted/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Adding..." : "Add Accessory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
