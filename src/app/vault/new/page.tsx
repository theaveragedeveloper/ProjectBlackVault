"use client";

import { useState, useRef } from "react";
import ImagePicker from "@/components/shared/ImagePicker";
import { HelpTip } from "@/components/shared/HelpTip";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FIREARM_TYPES, FIREARM_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import { ArrowLeft, Plus, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export default function NewFirearmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);
  const [compatCaliberTags, setCompatCaliberTags] = useState<string[]>([]);
  const [compatCaliberInput, setCompatCaliberInput] = useState("");
  const [compatCaliberDropdownOpen, setCompatCaliberDropdownOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const caliberRef = useRef<HTMLDivElement>(null);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );
  const showCustomCaliberOption =
    caliberInput.trim() !== "" &&
    !COMMON_CALIBERS.some((c) => c.toLowerCase() === caliberInput.toLowerCase().trim());

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const nameVal = (data.get("name") as string) ?? "";
    const errors: Record<string, string> = {};
    if (!nameVal.trim()) errors.name = "Name is required";
    if (!caliberInput.trim()) errors.caliber = "Caliber is required";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }
    setFormErrors({});

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
      initialRoundCount: data.get("initialRoundCount") ? Number(data.get("initialRoundCount")) : null,
    };

    try {
      const res = await fetch("/api/firearms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create firearm");
        setLoading(false);
        return;
      }

      router.push(`/vault/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-vault-border">
        <Link
          href="/vault"
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vault
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          Add Firearm
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-vault-text mb-1">New Firearm Entry</h2>
          <p className="text-sm text-vault-text-muted">Register a new firearm in the vault.</p>
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
                Firearm Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. My Glock 19"
                className={INPUT_CLASS}
                onChange={() => setFormErrors(prev => ({ ...prev, name: "" }))}
              />
              {formErrors.name && <p className="text-xs mt-1" style={{ color: "#E53935" }}>{formErrors.name}</p>}
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
                  placeholder="e.g. Glock"
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
                  placeholder="e.g. G19 Gen5"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Caliber Combobox */}
              <div>
                <label className={LABEL_CLASS}>
                  Caliber <span className="text-[#E53935]">*</span>
                </label>
                <div className="relative" ref={caliberRef}>
                  <input
                    type="text"
                    value={caliberInput}
                    onChange={(e) => {
                      setCaliberInput(e.target.value);
                      setCaliberDropdownOpen(true);
                      setFormErrors(prev => ({ ...prev, caliber: "" }));
                    }}
                    onFocus={() => setCaliberDropdownOpen(true)}
                    onBlur={() => setCaliberDropdownOpen(false)}
                    placeholder="e.g. 9mm Luger"
                    className={INPUT_CLASS}
                  />
                  {caliberDropdownOpen && (filteredCalibers.length > 0 || showCustomCaliberOption) && (
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
                      {showCustomCaliberOption && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCaliberInput(caliberInput.trim());
                            setCaliberDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#00C2FF] hover:bg-vault-border transition-colors font-mono border-t border-vault-border"
                        >
                          + Use &quot;{caliberInput.trim()}&quot;
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {formErrors.caliber && <p className="text-xs mt-1" style={{ color: "#E53935" }}>{formErrors.caliber}</p>}
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className={LABEL_CLASS}>
                  Type
                </label>
                <select id="type" name="type" className={INPUT_CLASS}>
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
                <HelpTip text="Other calibers this firearm can safely fire (e.g. a 5.56 rifle that also accepts .223 Rem)." />
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
                  onBlur={() => setCompatCaliberDropdownOpen(false)}
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
                        onPointerDown={(e) => e.preventDefault()}
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
                        onPointerDown={(e) => e.preventDefault()}
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
                <HelpTip text="Found on the receiver or frame. Stored as plain text in your local database." />
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                placeholder="e.g. ABC123456"
                className={`${INPUT_CLASS} font-mono`}
              />
              <p className="text-xs text-vault-text-faint mt-1">Must be unique across all firearms in vault.</p>
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
                className={INPUT_CLASS}
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <label htmlFor="currentValue" className={LABEL_CLASS}>
                  Current Value
                  <HelpTip text="Estimated current market value. Used for insurance records and total portfolio value on the dashboard." />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">$</span>
                  <input
                    id="currentValue"
                    name="currentValue"
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

          {/* Prior Use */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Prior Use
            </legend>
            <div>
              <label htmlFor="initialRoundCount" className={LABEL_CLASS}>
                Existing Round Count
                <HelpTip text="If this firearm has already been used, enter the approximate round count. This will be logged as a pre-existing use entry." />
              </label>
              <input
                id="initialRoundCount"
                name="initialRoundCount"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 500 (leave blank if new)"
                className={INPUT_CLASS}
              />
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
                <input id="lastMaintenanceDate" name="lastMaintenanceDate" type="date" className={INPUT_CLASS} />
              </div>
              <div>
                <label htmlFor="maintenanceIntervalDays" className={LABEL_CLASS}>
                  Maintenance Interval (days)
                  <HelpTip text="How often this firearm should be cleaned and inspected. Leave blank to disable maintenance reminders." />
                </label>
                <input id="maintenanceIntervalDays" name="maintenanceIntervalDays" type="number" min="1" step="1" placeholder="e.g. 180" className={INPUT_CLASS} />
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
                placeholder="Any additional notes about this firearm..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <Link
              href="/vault"
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
              {loading ? "Adding..." : "Add to Vault"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
