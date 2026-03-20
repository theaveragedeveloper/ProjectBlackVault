"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COMMON_CALIBERS, BULLET_TYPES } from "@/lib/types";
import { ArrowLeft, Plus, Loader2, AlertCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export default function NewAmmoStockPage() {
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
      caliber: caliberInput,
      brand: data.get("brand") as string,
      grainWeight: data.get("grainWeight") ? Number(data.get("grainWeight")) : null,
      bulletType: (data.get("bulletType") as string) || null,
      quantity: Number(data.get("quantity")) || 0,
      purchasePrice: data.get("purchasePrice") ? Number(data.get("purchasePrice")) : null,
      purchasePriceTotal: data.get("purchasePriceTotal") ? Number(data.get("purchasePriceTotal")) : null,
      purchaseDate: (data.get("purchaseDate") as string) || null,
      storageLocation: (data.get("storageLocation") as string) || null,
      lowStockAlert: data.get("lowStockAlert") ? Number(data.get("lowStockAlert")) : null,
      notes: (data.get("notes") as string) || null,
    };

    if (!payload.caliber) {
      setError("Caliber is required");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ammo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create ammo stock");
        setLoading(false);
        return;
      }

      router.push("/ammo");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      {/* Breadcrumb header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-vault-border">
        <Link
          href="/ammo"
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Ammo Depot
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          Add Stock
        </h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-vault-text mb-1">New Ammo Stock</h2>
          <p className="text-sm text-vault-text-muted">Add a new ammunition stock to the depot.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ammo Identity */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#F5A623] px-1 -ml-1">
              Ammo Identity
            </legend>

            {/* Caliber combobox */}
            <div>
              <label className={LABEL_CLASS}>
                Caliber <span className="text-[#E53935]">*</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className={LABEL_CLASS}>
                  Brand <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  required
                  placeholder="e.g. Federal"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="bulletType" className={LABEL_CLASS}>
                  Bullet Type
                </label>
                <select id="bulletType" name="bulletType" className={INPUT_CLASS}>
                  <option value="">Select type...</option>
                  {BULLET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="grainWeight" className={LABEL_CLASS}>
                  Grain Weight (gr)
                </label>
                <input
                  id="grainWeight"
                  name="grainWeight"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g. 115"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="quantity" className={LABEL_CLASS}>
                  Initial Quantity (rds) <span className="text-[#E53935]">*</span>
                </label>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 500"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </fieldset>

          {/* Purchase Details */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#F5A623] px-1 -ml-1">
              Purchase Details
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="purchasePrice" className={LABEL_CLASS}>
                  Price per Round
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">$</span>
                  <input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 0.28"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
                <p className="text-xs text-vault-text-faint mt-1">Optional if total price is provided.</p>
              </div>
              <div>
                <label htmlFor="purchasePriceTotal" className={LABEL_CLASS}>
                  Purchase Price (total)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">$</span>
                  <input
                    id="purchasePriceTotal"
                    name="purchasePriceTotal"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 140.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
                <p className="text-xs text-vault-text-faint mt-1">If entered alone, cost per round will be calculated from quantity.</p>
              </div>
              <div>
                <label htmlFor="purchasePriceTotal" className={LABEL_CLASS}>
                  Purchase Price (total)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-vault-text-faint text-sm">$</span>
                  <input
                    id="purchasePriceTotal"
                    name="purchasePriceTotal"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 140.00"
                    className={`${INPUT_CLASS} pl-7`}
                  />
                </div>
                <p className="text-xs text-vault-text-faint mt-1">If entered alone, price per round is calculated from quantity.</p>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="purchaseDate" className={LABEL_CLASS}>
                  Purchase Date
                </label>
                <input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </fieldset>

          {/* Storage & Alerts */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#F5A623] px-1 -ml-1">
              Storage & Alerts
            </legend>
            <div>
              <label htmlFor="storageLocation" className={LABEL_CLASS}>
                Storage Location
              </label>
              <input
                id="storageLocation"
                name="storageLocation"
                type="text"
                placeholder="e.g. Safe B · Shelf 2"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="lowStockAlert" className={LABEL_CLASS}>
                Low Stock Alert Threshold (rds)
              </label>
              <input
                id="lowStockAlert"
                name="lowStockAlert"
                type="number"
                min="0"
                placeholder="e.g. 100"
                className={INPUT_CLASS}
              />
              <p className="text-xs text-vault-text-faint mt-1">
                You&apos;ll be alerted on the dashboard when rounds fall at or below this number.
              </p>
            </div>
          </fieldset>

          {/* Notes */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#F5A623] px-1 -ml-1">
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
                placeholder="Any additional notes about this ammo stock..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/ammo"
              className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md hover:border-vault-text-muted/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
