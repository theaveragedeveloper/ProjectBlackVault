"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import {
  Target,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  caliber: string;
}

interface Build {
  id: string;
  name: string;
  isActive: boolean;
  slots: BuildSlot[];
}

interface BuildSlot {
  id: string;
  slotType: string;
  accessory: {
    id: string;
    name: string;
    type: string;
    roundCount: number;
  } | null;
}

interface AmmoStock {
  id: string;
  caliber: string;
  brand: string;
  grainWeight: number | null;
  bulletType: string | null;
  quantity: number;
}

const SLOT_TYPE_LABELS: Record<string, string> = {
  BARREL: "Barrel",
  SUPPRESSOR: "Suppressor",
  MUZZLE: "Muzzle",
  OPTIC: "Optic",
  TRIGGER: "Trigger",
  HANDGUARD: "Handguard",
  STOCK: "Stock",
  GRIP: "Grip",
};

// Slots that typically accumulate rounds
const ROUND_COUNT_SLOTS = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "TRIGGER", "SLIDE", "FRAME"]);

export default function RangeSessionPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoStocks, setAmmoStocks] = useState<AmmoStock[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [roundsFired, setRoundsFired] = useState<string>("");
  const [selectedAmmoStock, setSelectedAmmoStock] = useState<string>("");
  const [sessionNote, setSessionNote] = useState<string>("");
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(new Set());

  const [loadingFirearms, setLoadingFirearms] = useState(true);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [loadingAmmo, setLoadingAmmo] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ accessories: string[]; ammoLeft: number | null }>({
    accessories: [],
    ammoLeft: null,
  });

  // Load firearms
  useEffect(() => {
    fetch("/api/firearms")
      .then((r) => r.json())
      .then((data) => {
        setFirearms(data);
        setLoadingFirearms(false);
      })
      .catch(() => setLoadingFirearms(false));
  }, []);

  // Load ammo stocks
  useEffect(() => {
    fetch("/api/ammo")
      .then((r) => r.json())
      .then((data) => {
        setAmmoStocks(data.all ?? []);
        setLoadingAmmo(false);
      })
      .catch(() => setLoadingAmmo(false));
  }, []);

  // Load builds when firearm changes
  const loadBuilds = useCallback(async (firearmId: string) => {
    if (!firearmId) {
      setBuilds([]);
      return;
    }
    setLoadingBuilds(true);
    try {
      const res = await fetch(`/api/builds?firearmId=${firearmId}`);
      const data = await res.json();
      setBuilds(data);

      // Auto-select active build
      const active = data.find((b: Build) => b.isActive);
      if (active) {
        setSelectedBuild(active.id);
        // Auto-select barrel and suppressor
        const autoSelect = new Set<string>();
        for (const slot of active.slots) {
          if (slot.accessory && ROUND_COUNT_SLOTS.has(slot.slotType)) {
            autoSelect.add(slot.accessory.id);
          }
        }
        setSelectedAccessories(autoSelect);
      } else if (data.length > 0) {
        setSelectedBuild(data[0].id);
      } else {
        setSelectedBuild("");
      }
    } finally {
      setLoadingBuilds(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFirearm) {
      loadBuilds(selectedFirearm);
    } else {
      setBuilds([]);
      setSelectedBuild("");
    }
  }, [selectedFirearm, loadBuilds]);

  // Update accessory defaults when build changes
  useEffect(() => {
    const build = builds.find((b) => b.id === selectedBuild);
    if (!build) return;
    const autoSelect = new Set<string>();
    for (const slot of build.slots) {
      if (slot.accessory && ROUND_COUNT_SLOTS.has(slot.slotType)) {
        autoSelect.add(slot.accessory.id);
      }
    }
    setSelectedAccessories(autoSelect);
  }, [selectedBuild, builds]);

  const selectedFirearmData = firearms.find((f) => f.id === selectedFirearm);
  const selectedBuildData = builds.find((b) => b.id === selectedBuild);
  const buildAccessories = selectedBuildData?.slots.filter((s) => s.accessory) ?? [];

  // Filter ammo by firearm caliber
  const compatibleAmmo = selectedFirearmData
    ? ammoStocks.filter((a) => a.caliber === selectedFirearmData.caliber)
    : ammoStocks;

  function toggleAccessory(accessoryId: string) {
    setSelectedAccessories((prev) => {
      const next = new Set(prev);
      if (next.has(accessoryId)) {
        next.delete(accessoryId);
      } else {
        next.add(accessoryId);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const rounds = parseInt(roundsFired, 10);
    if (isNaN(rounds) || rounds <= 0) {
      setError("Please enter a valid number of rounds fired.");
      setSubmitting(false);
      return;
    }

    try {
      const results: string[] = [];
      let ammoLeft: number | null = null;

      // Log rounds to each selected accessory
      for (const accessoryId of selectedAccessories) {
        const slot = buildAccessories.find((s) => s.accessory?.id === accessoryId);
        const name = slot?.accessory?.name ?? accessoryId;
        const res = await fetch(`/api/accessories/${accessoryId}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rounds,
            note: sessionNote || `Range session`,
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(`Failed for ${name}: ${json.error}`);
        }
        results.push(name);
      }

      // Deduct ammo if stock selected
      if (selectedAmmoStock) {
        const res = await fetch(`/api/ammo/${selectedAmmoStock}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "RANGE_USE",
            quantity: rounds,
            note: sessionNote || "Range session",
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to deduct ammo");
        }
        ammoLeft = json.stock.quantity;
      }

      setSuccessDetails({ accessories: results, ammoLeft });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session log failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedFirearm("");
    setSelectedBuild("");
    setRoundsFired("");
    setSelectedAmmoStock("");
    setSessionNote("");
    setSelectedAccessories(new Set());
    setSuccess(false);
    setError(null);
    setBuilds([]);
  }

  if (success) {
    return (
      <div className="min-h-full">
        <PageHeader title="RANGE SESSION" subtitle="Log your range session rounds and usage" />
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-20 h-20 rounded-full bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#00C853]" />
          </div>
          <h2 className="text-2xl font-bold text-vault-text mb-2">Session Logged</h2>
          <p className="text-vault-text-muted mb-6 max-w-sm">
            Range session recorded successfully.
          </p>
          <div className="bg-vault-surface border border-vault-border rounded-lg p-5 text-left max-w-sm w-full mb-8">
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-3">Session Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-vault-text-muted">Rounds fired</span>
                <span className="text-sm font-mono font-bold text-[#00C2FF]">
                  {formatNumber(parseInt(roundsFired))}
                </span>
              </div>
              {successDetails.accessories.length > 0 && (
                <div>
                  <p className="text-sm text-vault-text-muted mb-1">Logged to accessories:</p>
                  {successDetails.accessories.map((name) => (
                    <p key={name} className="text-xs text-[#00C853] flex items-center gap-1.5 ml-2">
                      <CheckCircle2 className="w-3 h-3" />
                      {name}
                    </p>
                  ))}
                </div>
              )}
              {successDetails.ammoLeft != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-vault-text-muted">Ammo remaining</span>
                  <span className="text-sm font-mono text-[#F5A623]">
                    {formatNumber(successDetails.ammoLeft)} rds
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={resetForm}
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-5 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log Another Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="RANGE SESSION"
        subtitle="Log rounds fired, deduct ammo, and update accessory round counts"
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Firearm & Build */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Firearm & Build
            </legend>

            <div>
              <label className={LABEL_CLASS}>
                Firearm <span className="text-[#E53935]">*</span>
              </label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
                  <span className="text-sm text-vault-text-muted">Loading...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    required
                    value={selectedFirearm}
                    onChange={(e) => {
                      setSelectedFirearm(e.target.value);
                      setSelectedBuild("");
                      setSelectedAmmoStock("");
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select firearm...</option>
                    {firearms.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.caliber})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
              )}
            </div>

            {selectedFirearm && (
              <div>
                <label className={LABEL_CLASS}>Build</label>
                {loadingBuilds ? (
                  <div className="flex items-center gap-2 h-10">
                    <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
                    <span className="text-sm text-vault-text-muted">Loading builds...</span>
                  </div>
                ) : builds.length === 0 ? (
                  <p className="text-sm text-vault-text-faint py-2">No builds for this firearm.</p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedBuild}
                      onChange={(e) => setSelectedBuild(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      <option value="">No build selected</option>
                      {builds.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}{b.isActive ? " (Active)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Rounds & Ammo */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Rounds Fired
            </legend>

            <div>
              <label className={LABEL_CLASS}>
                Rounds Fired <span className="text-[#E53935]">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={roundsFired}
                onChange={(e) => setRoundsFired(e.target.value)}
                placeholder="e.g. 200"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Ammo Stock to Deduct From</label>
              {loadingAmmo ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" />
                </div>
              ) : compatibleAmmo.length === 0 ? (
                <p className="text-sm text-vault-text-faint py-2">
                  {selectedFirearmData
                    ? `No ${selectedFirearmData.caliber} stocks found.`
                    : "Select a firearm to filter compatible ammo."}
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedAmmoStock}
                    onChange={(e) => setSelectedAmmoStock(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">No deduction</option>
                    {compatibleAmmo.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.caliber} · {a.brand}
                        {a.grainWeight ? ` ${a.grainWeight}gr` : ""}
                        {a.bulletType ? ` ${a.bulletType}` : ""}
                        {" "}— {formatNumber(a.quantity)} rds
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
              )}
              <p className="text-xs text-vault-text-faint mt-1">
                This will deduct rounds from the selected stock.
              </p>
            </div>
          </fieldset>

          {/* Accessories Round Attribution */}
          {selectedBuildData && buildAccessories.length > 0 && (
            <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-3">
              <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
                Attribute Rounds To Accessories
              </legend>
              <p className="text-xs text-vault-text-muted">
                Select which accessories should have their round count incremented.
                Barrel and suppressor are pre-selected.
              </p>

              <div className="space-y-2">
                {buildAccessories.map((slot) => {
                  if (!slot.accessory) return null;
                  const isSelected = selectedAccessories.has(slot.accessory.id);
                  const isRoundCountPart = ROUND_COUNT_SLOTS.has(slot.slotType);

                  return (
                    <label
                      key={slot.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#00C2FF]/10 border-[#00C2FF]/30"
                          : "bg-vault-bg border-vault-border hover:border-vault-text-muted/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAccessory(slot.accessory!.id)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#00C2FF] border-[#00C2FF]"
                            : "border-vault-border"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-vault-bg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-vault-text truncate">
                            {slot.accessory.name}
                          </p>
                          {isRoundCountPart && (
                            <span className="text-[10px] text-[#F5A623] border border-[#F5A623]/30 px-1.5 py-0.5 rounded font-mono">
                              wear part
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-vault-text-faint">
                            {SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}
                          </span>
                          <span className="text-[10px] text-vault-text-faint">·</span>
                          <span className="text-[10px] font-mono text-vault-text-muted">
                            {formatNumber(slot.accessory.roundCount)} rds total
                          </span>
                        </div>
                      </div>
                      {isSelected && roundsFired && (
                        <span className="text-xs font-mono text-[#00C2FF] shrink-0">
                          +{formatNumber(parseInt(roundsFired) || 0)}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {selectedBuild && buildAccessories.length === 0 && (
            <div className="bg-vault-surface border border-vault-border rounded-lg p-5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-vault-text-faint" />
                <p className="text-sm text-vault-text-muted">
                  This build has no accessories installed. Rounds fired won&apos;t be attributed to any parts.
                </p>
              </div>
            </div>
          )}

          {/* Session Note */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Session Note
            </legend>
            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <textarea
                rows={3}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="e.g. Sunday range trip, competition practice, zeroing optic..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <div className="flex-1 text-xs text-vault-text-faint">
              {selectedAccessories.size > 0 && (
                <p>Will log rounds to {selectedAccessories.size} accessor{selectedAccessories.size !== 1 ? "ies" : "y"}</p>
              )}
              {selectedAmmoStock && roundsFired && (
                <p>Will deduct {formatNumber(parseInt(roundsFired) || 0)} rounds from stock</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !selectedFirearm || !roundsFired}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {submitting ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
