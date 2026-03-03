"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SLOT_TYPES, SLOT_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import { ArrowLeft, Save, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-[#0E1318] border border-[#1C2530] text-[#E8EDF2] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-[#4A5A6B] transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-[#8B9DB0] mb-1.5";

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  type: string;
  caliber: string | null;
  acquisitionDate: string | null;
  purchasePrice: number | null;
  notes: string | null;
  imageUrl: string | null;
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
  const accessoryId = params.id;

  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  useEffect(() => {
    fetch(`/api/accessories/${accessoryId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setAccessory(data);
          setCaliberInput(data.caliber ?? "");
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
      type: data.get("type") as string,
      caliber: caliberInput || null,
      acquisitionDate: (data.get("acquisitionDate") as string) || null,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: (data.get("imageUrl") as string) || null,
      imageSource: data.get("imageUrl") ? "url" : null,
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
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#1C2530] flex-wrap">
        <Link
          href={`/accessories/${accessoryId}`}
          className="flex items-center gap-1.5 text-[#8B9DB0] hover:text-[#E8EDF2] text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {accessory.name}
        </Link>
        <span className="text-[#1C2530]">/</span>
        <h1 className="text-sm font-semibold text-[#E8EDF2] tracking-wide uppercase">
          Edit Accessory
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#E8EDF2] mb-1">Edit {accessory.name}</h2>
          <p className="text-sm text-[#8B9DB0]">Update the details for this accessory.</p>
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
                defaultValue={accessory.name}
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="manufacturer" className={LABEL_CLASS}>
                  Manufacturer <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
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

            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label htmlFor="type" className={LABEL_CLASS}>
                  Type / Slot <span className="text-[#E53935]">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
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

            <div className="grid grid-cols-2 gap-4">
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
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5A6B] text-sm">
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
                defaultValue={accessory.imageUrl ?? ""}
                placeholder="https://example.com/image.jpg"
                className={INPUT_CLASS}
              />
              {accessory.imageUrl && (
                <div className="mt-3 w-full h-28 rounded-md overflow-hidden border border-[#1C2530]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={accessory.imageUrl}
                    alt={accessory.name}
                    className="w-full h-full object-contain bg-[#080B0F]"
                  />
                </div>
              )}
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
                defaultValue={accessory.notes ?? ""}
                placeholder="Any additional notes about this accessory..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/accessories/${accessoryId}`}
              className="px-4 py-2 text-sm text-[#8B9DB0] hover:text-[#E8EDF2] border border-[#1C2530] rounded-md hover:border-[#8B9DB0]/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
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
