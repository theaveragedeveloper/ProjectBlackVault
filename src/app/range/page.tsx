"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import { SLOT_TYPE_LABELS as SLOT_TYPE_LABELS_IMPORT } from "@/lib/types";
import {
  Target,
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  MapPin,
  ChevronRight,
  Thermometer,
  Wind,
  Cloud,
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

interface DrillTemplate {
  id: string;
  name: string;
  category: string;
}

interface DrillDraft {
  templateId: string;
  drillName: string;
  timeSeconds: string;
  hits: string;
  totalShots: string;
  score: string;
  notes: string;
}

const SLOT_TYPE_LABELS: Record<string, string> = SLOT_TYPE_LABELS_IMPORT as Record<string, string>;

// Slots that typically accumulate rounds (wear parts)
const ROUND_COUNT_SLOTS = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "TRIGGER", "SLIDE", "FRAME"]);

const LIGHT_CONDITIONS = ["BRIGHT", "OVERCAST", "LOW_LIGHT", "NIGHT"];
const LIGHT_CONDITION_LABELS: Record<string, string> = {
  BRIGHT: "Bright / Sunny",
  OVERCAST: "Overcast",
  LOW_LIGHT: "Low Light / Dusk",
  NIGHT: "Night",
};

function toDateTimeLocalValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function RangeSessionPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoStocks, setAmmoStocks] = useState<AmmoStock[]>([]);
  const [drillTemplates, setDrillTemplates] = useState<DrillTemplate[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [roundsFired, setRoundsFired] = useState<string>("");
  const [selectedAmmoStock, setSelectedAmmoStock] = useState<string>("");
  const [sessionNote, setSessionNote] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(() => toDateTimeLocalValue(new Date()));
  const [rangeName, setRangeName] = useState<string>("");
  const [rangeLocation, setRangeLocation] = useState<string>("");
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(new Set());

  // Environment / Weather
  const [showEnvFieldset, setShowEnvFieldset] = useState(false);
  const [environment, setEnvironment] = useState<"INDOOR" | "OUTDOOR" | "">("");
  const [temperatureF, setTemperatureF] = useState<string>("");
  const [windSpeedMph, setWindSpeedMph] = useState<string>("");
  const [windDirection, setWindDirection] = useState<string>("");
  const [humidity, setHumidity] = useState<string>("");
  const [lightCondition, setLightCondition] = useState<string>("");
  const [weatherNotes, setWeatherNotes] = useState<string>("");

  // Shot Groups
  const [showGroupFieldset, setShowGroupFieldset] = useState(false);
  const [targetDistanceYd, setTargetDistanceYd] = useState<string>("");
  const [groupSizeIn, setGroupSizeIn] = useState<string>("");
  const [numberOfGroups, setNumberOfGroups] = useState<string>("");
  const [groupNotes, setGroupNotes] = useState<string>("");
  const [sessionDrills, setSessionDrills] = useState<DrillDraft[]>([]);

  const [loadingFirearms, setLoadingFirearms] = useState(true);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [loadingAmmo, setLoadingAmmo] = useState(true);
  const [loadingDrillTemplates, setLoadingDrillTemplates] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<{ accessories: string[]; ammoLeft: number | null; drillCount: number }>({
    accessories: [],
    ammoLeft: null,
    drillCount: 0,
  });

  // MOA auto-computed
  const groupSizeMoa =
    targetDistanceYd && groupSizeIn && parseFloat(targetDistanceYd) > 0
      ? ((parseFloat(groupSizeIn) * 95.5) / parseFloat(targetDistanceYd)).toFixed(2)
      : null;

  // Load firearms
  useEffect(() => {
    fetch("/api/firearms")
      .then((r) => r.json())
      .then((data) => { setFirearms(data); setLoadingFirearms(false); })
      .catch(() => setLoadingFirearms(false));
  }, []);

  // Load ammo stocks
  useEffect(() => {
    fetch("/api/ammo")
      .then((r) => r.json())
      .then((data) => { setAmmoStocks(data.all ?? []); setLoadingAmmo(false); })
      .catch(() => setLoadingAmmo(false));
  }, []);

  // Load drill templates
  useEffect(() => {
    fetch("/api/drill-templates")
      .then((r) => r.json())
      .then((data) => {
        setDrillTemplates(Array.isArray(data) ? data : []);
        setLoadingDrillTemplates(false);
      })
      .catch(() => setLoadingDrillTemplates(false));
  }, []);

  // Load builds when firearm changes
  const loadBuilds = useCallback(async (firearmId: string) => {
    if (!firearmId) { setBuilds([]); return; }
    setLoadingBuilds(true);
    try {
      const res = await fetch(`/api/builds?firearmId=${firearmId}`);
      const data = await res.json();
      setBuilds(data);

      // Auto-select active build
      const active = data.find((b: Build) => b.isActive);
      const selectedB = active ?? (data.length > 0 ? data[0] : null);
      if (selectedB) {
        setSelectedBuild(selectedB.id);
        const autoSelect = new Set<string>();
        for (const slot of selectedB.slots) {
          if (slot.accessory) autoSelect.add(slot.accessory.id);
        }
        setSelectedAccessories(autoSelect);
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
      if (slot.accessory) autoSelect.add(slot.accessory.id);
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
      if (next.has(accessoryId)) next.delete(accessoryId);
      else next.add(accessoryId);
      return next;
    });
  }

  function addSessionDrill() {
    setSessionDrills((prev) => [
      ...prev,
      {
        templateId: "",
        drillName: "",
        timeSeconds: "",
        hits: "",
        totalShots: "",
        score: "",
        notes: "",
      },
    ]);
  }

  function removeSessionDrill(index: number) {
    setSessionDrills((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSessionDrill(index: number, field: keyof DrillDraft, value: string) {
    setSessionDrills((prev) =>
      prev.map((drill, i) => (i === index ? { ...drill, [field]: value } : drill))
    );
  }

  function handleTemplateSelect(index: number, templateId: string) {
    const template = drillTemplates.find((t) => t.id === templateId);
    setSessionDrills((prev) =>
      prev.map((drill, i) =>
        i === index
          ? {
              ...drill,
              templateId,
              drillName: drill.drillName || template?.name || "",
            }
          : drill
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const rounds = parseInt(roundsFired);
    if (!rounds || rounds <= 0) {
      setError("Please enter a valid number of rounds fired.");
      setSubmitting(false);
      return;
    }

    try {
      const results: string[] = [];
      let ammoLeft: number | null = null;
      let ammoTransactionId: string | null = null;
      const drillsPayload = sessionDrills
        .map((drill) => {
          const trimmedName = drill.drillName.trim();
          if (!trimmedName) return null;
          const hits = drill.hits ? parseInt(drill.hits, 10) : null;
          const totalShots = drill.totalShots ? parseInt(drill.totalShots, 10) : null;
          const computedAccuracy =
            hits != null && totalShots != null && totalShots > 0
              ? (hits / totalShots) * 100
              : null;

          return {
            templateId: drill.templateId || null,
            drillName: trimmedName,
            timeSeconds: drill.timeSeconds ? parseFloat(drill.timeSeconds) : null,
            hits,
            totalShots,
            accuracy: computedAccuracy,
            score: drill.score ? parseFloat(drill.score) : null,
            notes: drill.notes.trim() || null,
          };
        })
        .filter((drill): drill is NonNullable<typeof drill> => drill !== null);

      // Log rounds to each selected accessory
      for (const accessoryId of selectedAccessories) {
        const slot = buildAccessories.find((s) => s.accessory?.id === accessoryId);
        const name = slot?.accessory?.name ?? accessoryId;
        const res = await fetch(`/api/accessories/${accessoryId}/rounds`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rounds,
            note: sessionNote || (rangeName ? `Range session at ${rangeName}` : "Range session"),
          }),
        });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(`Failed for ${name}: ${json.error}`);
        }
        results.push(name);
      }

      // Deduct ammo if stock selected — capture transaction ID for ammo link
      if (selectedAmmoStock) {
        const res = await fetch(`/api/ammo/${selectedAmmoStock}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "RANGE_USE",
            quantity: rounds,
            note: sessionNote || (rangeName ? `Range session at ${rangeName}` : "Range session"),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to deduct ammo");
        ammoLeft = json.stock.quantity;
        ammoTransactionId = json.transaction?.id ?? null;
      }

      // Save range session record
      const sessionRes = await fetch("/api/range-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firearmId: selectedFirearm,
          buildId: selectedBuild || null,
          roundsFired: rounds,
          date: sessionDate ? new Date(sessionDate).toISOString() : undefined,
          rangeName: rangeName || null,
          rangeLocation: rangeLocation || null,
          notes: sessionNote || null,
          // environment
          environment: environment || null,
          temperatureF: temperatureF ? parseFloat(temperatureF) : null,
          windSpeedMph: windSpeedMph ? parseFloat(windSpeedMph) : null,
          windDirection: windDirection || null,
          humidity: humidity ? parseFloat(humidity) : null,
          lightCondition: lightCondition || null,
          weatherNotes: weatherNotes || null,
          // shot groups
          targetDistanceYd: targetDistanceYd ? parseFloat(targetDistanceYd) : null,
          groupSizeIn: groupSizeIn ? parseFloat(groupSizeIn) : null,
          groupSizeMoa: groupSizeMoa ? parseFloat(groupSizeMoa) : null,
          numberOfGroups: numberOfGroups ? parseInt(numberOfGroups) : null,
          groupNotes: groupNotes || null,
          // ammo link
          ammoTransactionIds: ammoTransactionId ? [ammoTransactionId] : [],
          drills: drillsPayload,
        }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionJson.error ?? "Failed to save session");
      setCreatedSessionId(sessionJson.id ?? null);

      setSuccessDetails({ accessories: results, ammoLeft, drillCount: drillsPayload.length });
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
    setSessionDate(toDateTimeLocalValue(new Date()));
    setRangeName("");
    setRangeLocation("");
    setSelectedAccessories(new Set());
    setEnvironment("");
    setTemperatureF("");
    setWindSpeedMph("");
    setWindDirection("");
    setHumidity("");
    setLightCondition("");
    setWeatherNotes("");
    setTargetDistanceYd("");
    setGroupSizeIn("");
    setNumberOfGroups("");
    setGroupNotes("");
    setSessionDrills([]);
    setCreatedSessionId(null);
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
          {rangeName && (
            <div className="flex items-center gap-1.5 text-sm text-vault-text-muted mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{rangeName}{rangeLocation ? ` · ${rangeLocation}` : ""}</span>
            </div>
          )}
          <p className="text-vault-text-muted mb-6 max-w-sm">Range session recorded successfully.</p>
          <div className="bg-vault-surface border border-vault-border rounded-lg p-5 text-left max-w-sm w-full mb-8">
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-3">Session Summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-vault-text-muted">Rounds fired</span>
                <span className="text-sm font-mono font-bold text-[#00C2FF]">{formatNumber(parseInt(roundsFired))}</span>
              </div>
              {successDetails.accessories.length > 0 && (
                <div>
                  <p className="text-sm text-vault-text-muted mb-1">Logged to accessories:</p>
                  {successDetails.accessories.map((name) => (
                    <p key={name} className="text-xs text-[#00C853] flex items-center gap-1.5 ml-2">
                      <CheckCircle2 className="w-3 h-3" />{name}
                    </p>
                  ))}
                </div>
              )}
              {successDetails.ammoLeft != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-vault-text-muted">Ammo remaining</span>
                  <span className="text-sm font-mono text-[#F5A623]">{formatNumber(successDetails.ammoLeft)} rds</span>
                </div>
              )}
              {successDetails.drillCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-vault-text-muted">Drills logged</span>
                  <span className="text-sm font-mono text-[#00C853]">{successDetails.drillCount}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {createdSessionId && (
              <Link href={`/range/${createdSessionId}`}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-5 py-2 rounded-md text-sm font-medium transition-colors">
                View Session <ChevronRight className="w-4 h-4" />
              </Link>
            )}
            <button onClick={resetForm}
              className="flex items-center gap-2 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/50 px-5 py-2 rounded-md text-sm font-medium transition-colors">
              Log Another Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <PageHeader title="RANGE SESSION" subtitle="Log rounds fired, deduct ammo, and update accessory round counts" />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Session Date */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Session Date
            </legend>
            <div>
              <label className={LABEL_CLASS}>Date &amp; Time</label>
              <input
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className={INPUT_CLASS}
              />
              <p className="text-xs text-vault-text-faint mt-1">Defaults to now. Change this to log past sessions.</p>
            </div>
          </fieldset>

          {/* Firearm & Build */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Firearm & Build
            </legend>

            <div>
              <label className={LABEL_CLASS}>Firearm <span className="text-[#E53935]">*</span></label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
                  <span className="text-sm text-vault-text-muted">Loading...</span>
                </div>
              ) : (
                <div className="relative">
                  <select required value={selectedFirearm}
                    onChange={(e) => { setSelectedFirearm(e.target.value); setSelectedBuild(""); setSelectedAmmoStock(""); }}
                    className={INPUT_CLASS}>
                    <option value="">Select firearm...</option>
                    {firearms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}{f.caliber ? ` (${f.caliber})` : ""}</option>
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
                    <select value={selectedBuild} onChange={(e) => setSelectedBuild(e.target.value)} className={INPUT_CLASS}>
                      <option value="">No build selected</option>
                      {builds.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}{b.isActive ? " (Active)" : ""}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                  </div>
                )}
              </div>
            )}
          </fieldset>

          {/* Range Location */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Range Location
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Range Name
                </label>
                <input
                  type="text"
                  value={rangeName}
                  onChange={(e) => setRangeName(e.target.value)}
                  placeholder="e.g. Eagle Eye Range"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Location / City</label>
                <input
                  type="text"
                  value={rangeLocation}
                  onChange={(e) => setRangeLocation(e.target.value)}
                  placeholder="e.g. Dallas, TX"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </fieldset>

          {/* Rounds & Ammo */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Rounds Fired
            </legend>

            <div>
              <label className={LABEL_CLASS}>Rounds Fired <span className="text-[#E53935]">*</span></label>
              <input type="number" min={1} required value={roundsFired} onChange={(e) => setRoundsFired(e.target.value)}
                placeholder="e.g. 200" className={INPUT_CLASS} />
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
                  <select value={selectedAmmoStock} onChange={(e) => setSelectedAmmoStock(e.target.value)} className={INPUT_CLASS}>
                    <option value="">No deduction</option>
                    {compatibleAmmo.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.caliber} · {a.brand}{a.grainWeight ? ` ${a.grainWeight}gr` : ""}{a.bulletType ? ` ${a.bulletType}` : ""} — {formatNumber(a.quantity)} rds
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
              )}
              <p className="text-xs text-vault-text-faint mt-1">This will deduct rounds from the selected stock.</p>
            </div>
          </fieldset>

          {/* Accessories Round Attribution */}
          {selectedBuildData && buildAccessories.length > 0 && (
            <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-3">
              <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
                Attribute Rounds To Accessories
              </legend>
              <p className="text-xs text-vault-text-muted">
                All accessories from the selected build are pre-selected. Uncheck any that shouldn&apos;t count rounds.
              </p>

              <div className="space-y-2">
                {buildAccessories.map((slot) => {
                  if (!slot.accessory) return null;
                  const isSelected = selectedAccessories.has(slot.accessory.id);
                  const isWearPart = ROUND_COUNT_SLOTS.has(slot.slotType);

                  return (
                    <label key={slot.id}
                      className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                        isSelected ? "bg-[#00C2FF]/10 border-[#00C2FF]/30" : "bg-vault-bg border-vault-border hover:border-vault-text-muted/30"
                      }`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleAccessory(slot.accessory!.id)} className="sr-only" />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-[#00C2FF] border-[#00C2FF]" : "border-vault-border"}`}>
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-vault-bg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-vault-text truncate">{slot.accessory.name}</p>
                          {isWearPart && (
                            <span className="text-[10px] text-[#F5A623] border border-[#F5A623]/30 px-1.5 py-0.5 rounded font-mono">wear</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-vault-text-faint">{SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}</span>
                          <span className="text-[10px] text-vault-text-faint">·</span>
                          <span className="text-[10px] font-mono text-vault-text-muted">{formatNumber(slot.accessory.roundCount)} rds total</span>
                        </div>
                      </div>
                      {isSelected && roundsFired && (
                        <span className="text-xs font-mono text-[#00C2FF] shrink-0">+{formatNumber(parseInt(roundsFired) || 0)}</span>
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
                <p className="text-sm text-vault-text-muted">This build has no accessories installed. Rounds fired won&apos;t be attributed to any parts.</p>
              </div>
            </div>
          )}

          {/* Environment & Weather (collapsible) */}
          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <button type="button"
              onClick={() => setShowEnvFieldset(!showEnvFieldset)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-vault-border/20 transition-colors">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#00C2FF]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#00C2FF]">Environment & Weather</span>
                <span className="text-xs text-vault-text-faint">(optional)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-vault-text-faint transition-transform ${showEnvFieldset ? "rotate-180" : ""}`} />
            </button>
            {showEnvFieldset && (
              <div className="px-5 pb-5 space-y-4 border-t border-vault-border">
                {/* Indoor / Outdoor toggle */}
                <div className="pt-4">
                  <label className={LABEL_CLASS}>Environment</label>
                  <div className="flex gap-2">
                    {(["OUTDOOR", "INDOOR"] as const).map((env) => (
                      <button key={env} type="button"
                        onClick={() => setEnvironment(environment === env ? "" : env)}
                        className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                          environment === env
                            ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                            : "bg-vault-bg border-vault-border text-vault-text-muted hover:border-vault-text-muted/50"
                        }`}>
                        {env === "OUTDOOR" ? "Outdoor" : "Indoor"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL_CLASS}>
                      <Thermometer className="w-3 h-3 inline mr-1" />
                      Temp (°F)
                    </label>
                    <input type="number" value={temperatureF} onChange={(e) => setTemperatureF(e.target.value)}
                      placeholder="72" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>
                      <Wind className="w-3 h-3 inline mr-1" />
                      Wind (mph)
                    </label>
                    <input type="number" min={0} value={windSpeedMph} onChange={(e) => setWindSpeedMph(e.target.value)}
                      placeholder="5" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Wind Dir.</label>
                    <input type="text" value={windDirection} onChange={(e) => setWindDirection(e.target.value)}
                      placeholder="NW / Headwind" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>
                      <Cloud className="w-3 h-3 inline mr-1" />
                      Humidity (%)
                    </label>
                    <input type="number" min={0} max={100} value={humidity} onChange={(e) => setHumidity(e.target.value)}
                      placeholder="45" className={INPUT_CLASS} />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL_CLASS}>Light Condition</label>
                    <div className="relative">
                      <select value={lightCondition} onChange={(e) => setLightCondition(e.target.value)} className={INPUT_CLASS}>
                        <option value="">Select...</option>
                        {LIGHT_CONDITIONS.map((lc) => (
                          <option key={lc} value={lc}>{LIGHT_CONDITION_LABELS[lc]}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={LABEL_CLASS}>Weather Notes</label>
                  <textarea rows={2} value={weatherNotes} onChange={(e) => setWeatherNotes(e.target.value)}
                    placeholder="e.g. Windy at 200yd but calm at 100yd..."
                    className={`${INPUT_CLASS} resize-none`} />
                </div>
              </div>
            )}
          </div>

          {/* Shot Groups (collapsible) */}
          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <button type="button"
              onClick={() => setShowGroupFieldset(!showGroupFieldset)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-vault-border/20 transition-colors">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00C2FF]" />
                <span className="text-xs font-mono uppercase tracking-widest text-[#00C2FF]">Shot Group Data</span>
                <span className="text-xs text-vault-text-faint">(optional)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-vault-text-faint transition-transform ${showGroupFieldset ? "rotate-180" : ""}`} />
            </button>
            {showGroupFieldset && (
              <div className="px-5 pb-5 space-y-4 border-t border-vault-border pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={LABEL_CLASS}>Distance (yd)</label>
                    <input type="number" min={0} value={targetDistanceYd} onChange={(e) => setTargetDistanceYd(e.target.value)}
                      placeholder="100" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Best Group (in)</label>
                    <input type="number" min={0} step={0.01} value={groupSizeIn} onChange={(e) => setGroupSizeIn(e.target.value)}
                      placeholder="0.75" className={INPUT_CLASS} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Best Group (MOA)</label>
                    <input type="text" readOnly value={groupSizeMoa ?? ""}
                      placeholder="auto-computed"
                      className={`${INPUT_CLASS} opacity-60 cursor-not-allowed`} />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}># of Groups</label>
                    <input type="number" min={1} value={numberOfGroups} onChange={(e) => setNumberOfGroups(e.target.value)}
                      placeholder="5" className={INPUT_CLASS} />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Group Notes</label>
                  <textarea rows={2} value={groupNotes} onChange={(e) => setGroupNotes(e.target.value)}
                    placeholder="e.g. First group was cold bore, last group tightest..."
                    className={`${INPUT_CLASS} resize-none`} />
                </div>
              </div>
            )}
          </div>

          {/* Drill Results (optional) */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Drill Results (optional)
            </legend>

            <div className="flex items-center justify-between">
              <p className="text-xs text-vault-text-muted">
                Add drill performance details as part of this session entry.
              </p>
              <button
                type="button"
                onClick={addSessionDrill}
                className="text-xs text-[#00C2FF] border border-[#00C2FF]/30 px-2.5 py-1 rounded-md hover:bg-[#00C2FF]/10 transition-colors"
              >
                + Add Drill
              </button>
            </div>

            {loadingDrillTemplates && (
              <p className="text-xs text-vault-text-faint">Loading drill templates...</p>
            )}

            {sessionDrills.length === 0 ? (
              <p className="text-xs text-vault-text-faint border border-vault-border rounded-md px-3 py-2">
                No drill entries added for this session.
              </p>
            ) : (
              <div className="space-y-3">
                {sessionDrills.map((drill, index) => (
                  <div key={index} className="bg-vault-bg border border-vault-border rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono">
                        Drill {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSessionDrill(index)}
                        className="text-[10px] text-[#E53935] border border-[#E53935]/30 px-2 py-0.5 rounded hover:bg-[#E53935]/10 transition-colors"
                      >
                        Remove
                      </button>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Template</label>
                      <div className="relative">
                        <select
                          value={drill.templateId}
                          onChange={(e) => handleTemplateSelect(index, e.target.value)}
                          className={INPUT_CLASS}
                        >
                          <option value="">Custom / No Template</option>
                          {drillTemplates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.category})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Drill Name</label>
                      <input
                        type="text"
                        value={drill.drillName}
                        onChange={(e) => updateSessionDrill(index, "drillName", e.target.value)}
                        placeholder="e.g. Bill Drill"
                        className={INPUT_CLASS}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className={LABEL_CLASS}>Time (sec)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={drill.timeSeconds}
                          onChange={(e) => updateSessionDrill(index, "timeSeconds", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Hits</label>
                        <input
                          type="number"
                          min={0}
                          value={drill.hits}
                          onChange={(e) => updateSessionDrill(index, "hits", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Shots</label>
                        <input
                          type="number"
                          min={0}
                          value={drill.totalShots}
                          onChange={(e) => updateSessionDrill(index, "totalShots", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Score</label>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={drill.score}
                          onChange={(e) => updateSessionDrill(index, "score", e.target.value)}
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL_CLASS}>Drill Notes</label>
                      <textarea
                        rows={2}
                        value={drill.notes}
                        onChange={(e) => updateSessionDrill(index, "notes", e.target.value)}
                        className={`${INPUT_CLASS} resize-none`}
                        placeholder="Optional notes for this drill"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          {/* Session Note */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Session Notes
            </legend>
            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <textarea rows={3} value={sessionNote} onChange={(e) => setSessionNote(e.target.value)}
                placeholder="e.g. Sunday range trip, competition practice, zeroing optic..."
                className={`${INPUT_CLASS} resize-none`} />
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
            <button type="submit" disabled={submitting || !selectedFirearm || !roundsFired}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md text-sm font-medium transition-colors">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {submitting ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
