"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { FIREARM_TYPES, FIREARM_TYPE_LABELS, COMMON_CALIBERS } from "@/lib/types";
import { ArrowLeft, Save, Loader2, AlertCircle, Upload } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  caliber: string;
  serialNumber: string;
  type: string;
  acquisitionDate: string;
  purchasePrice: number | null;
  currentValue: number | null;
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

export default function EditFirearmPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const firearmId = params.id;

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [caliberInput, setCaliberInput] = useState("");
  const [caliberDropdownOpen, setCaliberDropdownOpen] = useState(false);
  const caliberRef = useRef<HTMLDivElement>(null);

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCalibers = COMMON_CALIBERS.filter((c) =>
    c.toLowerCase().includes(caliberInput.toLowerCase())
  );

  useEffect(() => {
    fetch(`/api/firearms/${firearmId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setFirearm(data);
          setCaliberInput(data.caliber ?? "");
          setImageUrlInput(data.imageUrl ?? "");
        }
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Failed to load firearm");
        setDataLoading(false);
      });
  }, [firearmId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("entityType", "firearm");
    form.append("entityId", firearmId);
    try {
      const res = await fetch("/api/images/upload", { method: "POST", body: form });
      const json = await res.json();
      if (res.ok) {
        setImageUrlInput(json.url);
      } else {
        setUploadError(json.error ?? "Upload failed");
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

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
      serialNumber: data.get("serialNumber") as string,
      type: data.get("type") as string,
      acquisitionDate: data.get("acquisitionDate") as string,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      currentValue: data.get("currentValue") ? Number(data.get("currentValue")) : null,
      notes: (data.get("notes") as string) || null,
      imageUrl: (data.get("imageUrl") as string) || null,
      imageSource: data.get("imageUrl") ? "url" : null,
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

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
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
                  Manufacturer <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
                  defaultValue={firearm.manufacturer}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="model" className={LABEL_CLASS}>
                  Model <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  required
                  defaultValue={firearm.model}
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
                    }}
                    onFocus={() => setCaliberDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setCaliberDropdownOpen(false), 150)}
                    required
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
                  Type <span className="text-[#E53935]">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
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

            <div>
              <label htmlFor="serialNumber" className={LABEL_CLASS}>
                Serial Number <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="serialNumber"
                name="serialNumber"
                type="text"
                required
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
                Date Acquired <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="acquisitionDate"
                name="acquisitionDate"
                type="date"
                required
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

          {/* Image */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Image
            </legend>
            <div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 mb-3 px-3 py-2 text-sm rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-[#00C2FF]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              {uploadError && (
                <p className="text-xs text-[#E53935] mb-2">{uploadError}</p>
              )}
              <label htmlFor="imageUrl" className={LABEL_CLASS}>
                Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={INPUT_CLASS}
              />
              {imageUrlInput && (
                <div className="mt-3 w-full h-32 rounded-md overflow-hidden border border-vault-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrlInput}
                    alt={firearm.name}
                    className="w-full h-full object-contain bg-vault-bg"
                  />
                </div>
              )}
            </div>
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
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/vault/${firearmId}`}
              className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md hover:border-vault-text-muted/30 transition-colors"
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
