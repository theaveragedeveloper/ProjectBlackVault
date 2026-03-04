"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SLOT_TYPES, SLOT_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import { ArrowLeft, Plus, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-[#0E1318] border border-[#1C2530] text-[#E8EDF2] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-[#4A5A6B] transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-[#8B9DB0] mb-1.5";

export default function NewAccessoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get("name") as string,
      manufacturer: data.get("manufacturer") as string,
      model: (data.get("model") as string) || null,
      type: data.get("type") as string,
      caliber: caliberInput || null,
      acquisitionDate: (data.get("acquisitionDate") as string) || null,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: (data.get("imageUrl") as string) || null,
      imageSource: data.get("imageUrl") ? "url" : null,
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
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1C2530]">
        <Link
          href="/accessories"
          className="flex items-center gap-1.5 text-[#8B9DB0] hover:text-[#E8EDF2] text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Accessories
        </Link>
        <span className="text-[#1C2530]">/</span>
        <h1 className="text-sm font-semibold text-[#E8EDF2] tracking-wide uppercase">
          Add Accessory
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#E8EDF2] mb-1">New Accessory Entry</h2>
          <p className="text-sm text-[#8B9DB0]">Register a new part or attachment in the arsenal.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5 space-y-4">
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
                  Manufacturer <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
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
                  Type / Slot <span className="text-[#E53935]">*</span>
                </label>
                <select id="type" name="type" required className={INPUT_CLASS}>
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
                    onBlur={() => setTimeout(() => setCaliberDropdownOpen(false), 150)}
                    placeholder="e.g. 5.56x45mm"
                    className={INPUT_CLASS}
                  />
                  {caliberDropdownOpen && filteredCalibers.length > 0 && caliberInput && (
                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#0E1318] border border-[#1C2530] rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredCalibers.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCaliberInput(c);
                            setCaliberDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-[#E8EDF2] hover:bg-[#1C2530] hover:text-[#00C2FF] transition-colors font-mono"
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
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5 space-y-4">
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5A6B] text-sm">$</span>
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

          {/* Image */}
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Image
            </legend>
            <div>
              <label htmlFor="imageUrl" className={LABEL_CLASS}>
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                className={INPUT_CLASS}
              />
            </div>
          </fieldset>

          {/* Notes */}
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5 space-y-4">
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/accessories"
              className="px-4 py-2 text-sm text-[#8B9DB0] hover:text-[#E8EDF2] border border-[#1C2530] rounded-md hover:border-[#8B9DB0]/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
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
