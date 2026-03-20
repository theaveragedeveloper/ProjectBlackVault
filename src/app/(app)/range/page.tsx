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
  ClipboardList,
  Plus,
  X,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-sm font-medium text-vault-text-muted mb-1.5";

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

interface AmmoUsageEntry {
  key: string;
  stockId: string;
  quantity: string;
}

const SLOT_TYPE_LABELS: Record<string, string> = SLOT_TYPE_LABELS_IMPORT as Record<string, string>;

// Slots that typically accumulate rounds (wear parts)
const ROUND_COUNT_SLOTS = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "TRIGGER", "SLIDE", "FRAME"]);

interface DrillTemplate {
  id: string;
  name: string;
  category: string;
  scoringType: string;
  parTime: number | null;
  maxScore: number | null;
}

interface InlineDrill {
  key: string; // client-side unique key
  templateId: string;
  drillName: string;
  timeSeconds: string;
  hits: string;
  totalShots: string;
  score: string;
  notes: string;
  passFail: "PASS" | "FAIL";
}

const DRILL_CATEGORY_LABELS: Record<string, string> = {
  ACCURACY: "Accuracy",
  SPEED: "Speed",
  TACTICAL: "Tactical",
  FUNDAMENTALS: "Fundamentals",
  CUSTOM: "Custom",
};

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

  const [selectedFirearms, setSelectedFirearms] = useState<Set<string>>(new Set());
  const [roundsByFirearm, setRoundsByFirearm] = useState<Record<string, string>>({});
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [primaryFirearmId, setPrimaryFirearmId] = useState<string>("");
  const [ammoUsageEntries, setAmmoUsageEntries] = useState<AmmoUsageEntry[]>([
    { key: crypto.randomUUID(), stockId: "", quantity: "" },
  ]);
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

  // Drills
  const [drillTemplates, setDrillTemplates] = useState<DrillTemplate[]>([]);
  const [showDrillFieldset, setShowDrillFieldset] = useState(false);
  const [inlineDrills, setInlineDrills] = useState<InlineDrill[]>([]);
  const [addingDrill, setAddingDrill] = useState(false);
  const [newDrill, setNewDrill] = useState<Omit<InlineDrill, "key">>({
    templateId: "",
    drillName: "",
    timeSeconds: "",
    hits: "",
    totalShots: "",
    score: "",
    notes: "",
    passFail: "PASS",
  });

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
  const [successDetails, setSuccessDetails] = useState<{ accessories: string[]; ammoLeft: string[] }>({
    accessories: [],
    ammoLeft: [],
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

  // Load drill templates
  useEffect(() => {
    fetch("/api/drill-templates")
      .then((r) => r.json())
      .then((data) => setDrillTemplates(Array.isArray(data) ? data : []))
      .catch(() => {});
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
    if (primaryFirearmId) {
      loadBuilds(primaryFirearmId);
    } else {
      setBuilds([]);
      setSelectedBuild("");
    }
  }, [primaryFirearmId, loadBuilds]);

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

  const selectedFirearmIds = Array.from(selectedFirearms);
  const selectedBuildData = builds.find((b) => b.id === selectedBuild);
  const buildAccessories = selectedBuildData?.slots.filter((s) => s.accessory) ?? [];

  // Filter ammo by selected firearm caliber(s)
  const selectedCalibers = new Set(
    firearms.filter((f) => selectedFirearms.has(f.id)).map((f) => f.caliber).filter(Boolean)
  );
  const compatibleAmmo = selectedCalibers.size > 0
    ? ammoStocks.filter((a) => selectedCalibers.has(a.caliber))
    : ammoStocks;

  const totalEnteredRounds = selectedFirearmIds.reduce(
    (sum, id) => sum + (parseInt(roundsByFirearm[id] ?? "0", 10) || 0),
    0
  );

  const totalAmmoToDeduct = ammoUsageEntries.reduce((sum, entry) => {
    if (!entry.stockId || entry.quantity === "") return sum;
    const parsed = parseInt(entry.quantity, 10);
    return Number.isFinite(parsed) && parsed > 0 ? sum + parsed : sum;
  }, 0);

  const hasAmmoDeduction = ammoUsageEntries.some((entry) => entry.stockId && entry.quantity !== "");

  function toggleAccessory(accessoryId: string) {
    setSelectedAccessories((prev) => {
      const next = new Set(prev);
      if (next.has(accessoryId)) next.delete(accessoryId);
      else next.add(accessoryId);
      return next;
    });
  }

  function toggleFirearm(firearmId: string) {
    setSelectedFirearms((prev) => {
      const next = new Set(prev);
      if (next.has(firearmId)) {
        next.delete(firearmId);
        setRoundsByFirearm((current) => { const c = { ...current }; delete c[firearmId]; return c; });
      } else {
        next.add(firearmId);
      }
      const first = next.values().next().value ?? "";
      setPrimaryFirearmId(first);
      if (next.size === 0 || !next.has(primaryFirearmId)) setSelectedBuild("");
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (selectedFirearmIds.length === 0) {
      setError("Select at least one firearm.");
      setSubmitting(false);
      return;
    }

    const firearmEntries = selectedFirearmIds.map((firearmId) => ({
      firearmId,
      buildId: firearmId === primaryFirearmId && selectedBuild ? selectedBuild : null,
      roundsFired: parseInt(roundsByFirearm[firearmId] ?? "", 10),
    }));

    if (firearmEntries.some((entry) => !Number.isFinite(entry.roundsFired) || entry.roundsFired <= 0)) {
      setError("Each selected firearm needs a valid rounds fired value.");
      setSubmitting(false);
      return;
    }

    const rounds = firearmEntries.reduce((sum, entry) => sum + entry.roundsFired, 0);

    try {
      const results: string[] = [];
      const ammoLeft: string[] = [];
      const ammoTransactionIds: string[] = [];

      const selectedAmmoEntries = ammoUsageEntries.filter((entry) => entry.stockId && entry.quantity !== "");
      if (selectedAmmoEntries.length > 0) {
        if (selectedAmmoEntries.some((entry) => !Number.isFinite(parseInt(entry.quantity, 10)) || parseInt(entry.quantity, 10) <= 0)) {
          throw new Error("Ammo deduction quantities must be whole numbers greater than 0.");
        }
        const totalSelectedAmmoRounds = selectedAmmoEntries.reduce((sum, entry) => sum + parseInt(entry.quantity, 10), 0);
        if (totalSelectedAmmoRounds > rounds) {
          throw new Error("Ammo deduction total cannot exceed rounds fired.");
        }
      }

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

      // Deduct ammo for each selected stock — capture transaction IDs for session links
      for (const entry of selectedAmmoEntries) {
        const stockId = entry.stockId;
        const quantity = parseInt(entry.quantity, 10);
        const stock = compatibleAmmo.find((ammo) => ammo.id === stockId) ?? ammoStocks.find((ammo) => ammo.id === stockId);

        const res = await fetch(`/api/ammo/${stockId}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "RANGE_USE",
            quantity,
            note: sessionNote || (rangeName ? `Range session at ${rangeName}` : "Range session"),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to deduct ammo");

        if (json.transaction?.id) ammoTransactionIds.push(json.transaction.id);
        const label = stock
          ? `${stock.caliber} · ${stock.brand}${stock.grainWeight ? ` ${stock.grainWeight}gr` : ""}${stock.bulletType ? ` ${stock.bulletType}` : ""}`
          : "Ammo stock";
        ammoLeft.push(`${label}: ${formatNumber(json.stock.quantity)} rds left`);
      }

      // Save range session record
      const sessionRes = await fetch("/api/range-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firearms: firearmEntries,
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
          ammoTransactionIds,
        }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionJson.error ?? "Failed to save session");
      const sessionId = sessionJson.id ?? null;
      setCreatedSessionId(sessionId);

      // Save inline drills
      if (sessionId && inlineDrills.length > 0) {
        for (let i = 0; i < inlineDrills.length; i++) {
          const d = inlineDrills[i];
          const st = drillTemplates.find((t) => t.id === d.templateId)?.scoringType ?? "NOTES_ONLY";
          let score: number | null = null;
          if (st === "PASS_FAIL") {
            score = d.passFail === "PASS" ? 1 : 0;
          } else if (d.score !== "") {
            score = parseFloat(d.score);
          }
          const hits = d.hits !== "" ? parseInt(d.hits) : null;
          const totalShots = d.totalShots !== "" ? parseInt(d.totalShots) : null;
          const accuracy = hits != null && totalShots != null && totalShots > 0
            ? Math.round((hits / totalShots) * 1000) / 10
            : null;
          await fetch(`/api/range-sessions/${sessionId}/drills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateId: d.templateId || null,
              drillName: d.drillName,
              timeSeconds: d.timeSeconds !== "" ? parseFloat(d.timeSeconds) : null,
              hits,
              totalShots,
              accuracy,
              score,
              notes: d.notes || null,
              sortOrder: i,
            }),
          });
        }
      }

      setSuccessDetails({ accessories: results, ammoLeft, drillCount: drillsPayload.length });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session log failed");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedFirearms(new Set());
    setRoundsByFirearm({});
    setPrimaryFirearmId("");
    setSelectedBuild("");
    setAmmoUsageEntries([{ key: crypto.randomUUID(), stockId: "", quantity: "" }]);
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
    setInlineDrills([]);
    setAddingDrill(false);
    setNewDrill({ templateId: "", drillName: "", timeSeconds: "", hits: "", totalShots: "", score: "", notes: "", passFail: "PASS" });
  }

  if (success) {
    return (
      <div className="min-h-full">
        <PageHeader title="Range Session" subtitle="Log rounds and keep your training history up to date." />
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
            <p className="text-sm font-medium text-vault-text-faint mb-3">Session summary</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-vault-text-muted">Rounds fired</span>
                <span className="text-sm font-mono font-bold text-[#00C2FF]">{formatNumber(totalEnteredRounds)}</span>
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
              {successDetails.ammoLeft.length > 0 && (
                <div>
                  <p className="text-sm text-vault-text-muted mb-1">Ammo remaining:</p>
                  <div className="space-y-1">
                    {successDetails.ammoLeft.map((summary) => (
                      <p key={summary} className="text-xs text-[#F5A623] font-mono ml-2">{summary}</p>
                    ))}
                  </div>
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
      <PageHeader title="Range Session" subtitle="Log rounds, update ammo counts, and track accessory usage." />

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
            <legend className="text-sm font-semibold text-[#00C2FF] px-1 -ml-1">
              Firearm & Build
            </legend>

            <div>
              <label className={LABEL_CLASS}>Firearms <span className="text-[#E53935]">*</span></label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" />
                  <span className="text-sm text-vault-text-muted">Loading...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {firearms.map((f) => {
                    const checked = selectedFirearms.has(f.id);
                    return (
                      <label key={f.id} className={`flex items-center justify-between gap-3 p-2.5 rounded-md border cursor-pointer ${checked ? "bg-[#00C2FF]/10 border-[#00C2FF]/30" : "bg-vault-bg border-vault-border"}`}>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={checked} onChange={() => toggleFirearm(f.id)} />
                          <span className="text-sm text-vault-text">{f.name}{f.caliber ? ` (${f.caliber})` : ""}</span>
                        </div>
                        {checked && (
                          <input
                            type="number"
                            min={1}
                            value={roundsByFirearm[f.id] ?? ""}
                            onChange={(e) => setRoundsByFirearm((prev) => ({ ...prev, [f.id]: e.target.value }))}
                            placeholder="Rounds"
                            className="w-28 bg-vault-surface border border-vault-border text-vault-text rounded-md px-2 py-1 text-xs"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {primaryFirearmId && (
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
            <legend className="text-sm font-semibold text-[#00C2FF] px-1 -ml-1">
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
            <legend className="text-sm font-semibold text-[#00C2FF] px-1 -ml-1">
              Rounds Fired
            </legend>

            <div>
              <label className={LABEL_CLASS}>Rounds Fired <span className="text-[#E53935]">*</span></label>
              <input type="number" min={1} required value={totalEnteredRounds} readOnly
                placeholder="e.g. 200" className={`${INPUT_CLASS} opacity-80`} />
            </div>

            <div>
              <label className={LABEL_CLASS}>Ammo to Deduct</label>
              {loadingAmmo ? (
                <div className="flex items-center gap-2 h-10">
                  <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" />
                </div>
              ) : compatibleAmmo.length === 0 ? (
                <p className="text-sm text-vault-text-faint py-2">
                  {selectedCalibers.size > 0
                    ? `No compatible stocks found for selected caliber${selectedCalibers.size > 1 ? "s" : ""}.`
                    : "Select one or more firearms to filter compatible ammo."}
                </p>
              ) : (
                <div className="space-y-2">
                  {ammoUsageEntries.map((entry, idx) => (
                    <div key={entry.key} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2 items-start">
                      <div className="relative">
                        <select
                          value={entry.stockId}
                          onChange={(e) => setAmmoUsageEntries((prev) => prev.map((item) => item.key === entry.key ? { ...item, stockId: e.target.value } : item))}
                          className={INPUT_CLASS}
                        >
                          <option value="">No deduction</option>
                          {compatibleAmmo.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.caliber} · {a.brand}{a.grainWeight ? ` ${a.grainWeight}gr` : ""}{a.bulletType ? ` ${a.bulletType}` : ""} — {formatNumber(a.quantity)} rds
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={entry.quantity}
                        onChange={(e) => setAmmoUsageEntries((prev) => prev.map((item) => item.key === entry.key ? { ...item, quantity: e.target.value } : item))}
                        placeholder="Rounds"
                        className={INPUT_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() => setAmmoUsageEntries((prev) => prev.length > 1 ? prev.filter((item) => item.key !== entry.key) : prev)}
                        disabled={idx === 0 && ammoUsageEntries.length === 1}
                        className="h-10 px-3 rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmmoUsageEntries((prev) => [...prev, { key: crypto.randomUUID(), stockId: "", quantity: "" }])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-dashed border-vault-border text-vault-text-faint hover:text-[#00C2FF] hover:border-[#00C2FF]/40"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add ammo type
                  </button>
                </div>
              )}
              <p className="text-xs text-vault-text-faint mt-1">You can log multiple ammo types/loadouts for one session.</p>
            </div>
          </fieldset>

          {/* Accessories Round Attribution */}
          {selectedBuildData && buildAccessories.length > 0 && (
            <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-3">
              <legend className="text-sm font-semibold text-[#00C2FF] px-1 -ml-1">
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
                      {isSelected && totalEnteredRounds > 0 && (
                        <span className="text-xs font-mono text-[#00C2FF] shrink-0">+{formatNumber(totalEnteredRounds)}</span>
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
                <span className="text-sm font-semibold text-[#00C2FF]">Environment & Weather</span>
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
                <span className="text-sm font-semibold text-[#00C2FF]">Shot Group Data</span>
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

          {/* Drills (collapsible) */}
          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <button type="button"
              onClick={() => setShowDrillFieldset(!showDrillFieldset)}
              className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-vault-border/20 transition-colors">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#00C2FF]" />
                <span className="text-sm font-semibold text-[#00C2FF]">Drills</span>
                {inlineDrills.length > 0 && (
                  <span className="text-xs text-[#00C853] ml-1">{inlineDrills.length} logged</span>
                )}
                <span className="text-xs text-vault-text-faint">(optional)</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-vault-text-faint transition-transform ${showDrillFieldset ? "rotate-180" : ""}`} />
            </button>
            {showDrillFieldset && (
              <div className="px-5 pb-5 border-t border-vault-border">
                {/* Existing drills */}
                {inlineDrills.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {inlineDrills.map((d, idx) => {
                      const st = drillTemplates.find((t) => t.id === d.templateId)?.scoringType ?? "NOTES_ONLY";
                      return (
                        <div key={d.key} className="flex items-start gap-3 p-3 rounded-md border border-vault-border bg-vault-bg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-vault-text">{d.drillName}</p>
                            <p className="text-xs text-vault-text-faint mt-0.5">
                              {(st === "TIME" || st === "TIME_AND_SCORE") && d.timeSeconds && `${d.timeSeconds}s `}
                              {(st === "SCORE" || st === "TIME_AND_SCORE") && d.score && `Score: ${d.score} `}
                              {st === "PASS_FAIL" && `${d.passFail} `}
                              {d.hits && d.totalShots && `${d.hits}/${d.totalShots} hits`}
                            </p>
                          </div>
                          <button type="button"
                            onClick={() => setInlineDrills((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-vault-text-faint hover:text-red-400 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add drill form */}
                {addingDrill ? (
                  <div className="mt-4 rounded-md border border-[#00C2FF]/20 bg-[#00C2FF]/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-[#00C2FF]">Add Drill</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Drill Template</label>
                        <select
                          value={newDrill.templateId}
                          onChange={(e) => {
                            const t = drillTemplates.find((t) => t.id === e.target.value);
                            setNewDrill((p) => ({ ...p, templateId: e.target.value, drillName: t ? t.name : p.drillName }));
                          }}
                          className={INPUT_CLASS}>
                          <option value="">— No template —</option>
                          {Object.entries(DRILL_CATEGORY_LABELS).map(([cat, lbl]) => {
                            const grp = drillTemplates.filter((t) => t.category === cat);
                            if (!grp.length) return null;
                            return (
                              <optgroup key={cat} label={lbl}>
                                {grp.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </optgroup>
                            );
                          })}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Drill Name <span className="text-[#E53935]">*</span></label>
                        <input type="text" value={newDrill.drillName}
                          onChange={(e) => setNewDrill((p) => ({ ...p, drillName: e.target.value }))}
                          placeholder="e.g. Bill Drill" className={INPUT_CLASS} />
                      </div>

                      {(() => {
                        const st = drillTemplates.find((t) => t.id === newDrill.templateId)?.scoringType ?? "NOTES_ONLY";
                        const tpl = drillTemplates.find((t) => t.id === newDrill.templateId);
                        return (
                          <>
                            {(st === "TIME" || st === "TIME_AND_SCORE") && (
                              <div>
                                <label className={LABEL_CLASS}>Time (s){tpl?.parTime && <span className="text-vault-text-faint ml-1">par: {tpl.parTime}s</span>}</label>
                                <input type="number" step="0.01" min="0" value={newDrill.timeSeconds}
                                  onChange={(e) => setNewDrill((p) => ({ ...p, timeSeconds: e.target.value }))}
                                  placeholder="4.32" className={INPUT_CLASS} />
                              </div>
                            )}
                            {(st === "SCORE" || st === "TIME_AND_SCORE") && (
                              <div>
                                <label className={LABEL_CLASS}>Score{tpl?.maxScore && <span className="text-vault-text-faint ml-1">max: {tpl.maxScore}</span>}</label>
                                <input type="number" step="0.1" min="0" value={newDrill.score}
                                  onChange={(e) => setNewDrill((p) => ({ ...p, score: e.target.value }))}
                                  placeholder="85" className={INPUT_CLASS} />
                              </div>
                            )}
                            {st === "PASS_FAIL" && (
                              <div className="sm:col-span-2">
                                <label className={LABEL_CLASS}>Result</label>
                                <div className="flex gap-2">
                                  {(["PASS", "FAIL"] as const).map((v) => (
                                    <button key={v} type="button"
                                      onClick={() => setNewDrill((p) => ({ ...p, passFail: v }))}
                                      className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                                        newDrill.passFail === v
                                          ? v === "PASS" ? "bg-green-500/20 border-green-500/40 text-green-400" : "bg-red-500/20 border-red-500/40 text-red-400"
                                          : "border-vault-border text-vault-text-muted hover:bg-vault-border"
                                      }`}>{v}</button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {st !== "NOTES_ONLY" && (
                              <>
                                <div>
                                  <label className={LABEL_CLASS}>Hits</label>
                                  <input type="number" min="0" value={newDrill.hits}
                                    onChange={(e) => setNewDrill((p) => ({ ...p, hits: e.target.value }))}
                                    placeholder="6" className={INPUT_CLASS} />
                                </div>
                                <div>
                                  <label className={LABEL_CLASS}>Total Shots</label>
                                  <input type="number" min="0" value={newDrill.totalShots}
                                    onChange={(e) => setNewDrill((p) => ({ ...p, totalShots: e.target.value }))}
                                    placeholder="6" className={INPUT_CLASS} />
                                </div>
                              </>
                            )}
                          </>
                        );
                      })()}

                      <div className="sm:col-span-2">
                        <label className={LABEL_CLASS}>Notes</label>
                        <textarea rows={2} value={newDrill.notes}
                          onChange={(e) => setNewDrill((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="Observations..." className={`${INPUT_CLASS} resize-none`} />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="button"
                        disabled={!newDrill.drillName.trim()}
                        onClick={() => {
                          if (!newDrill.drillName.trim()) return;
                          setInlineDrills((prev) => [...prev, { ...newDrill, key: Math.random().toString(36).slice(2) }]);
                          setNewDrill({ templateId: newDrill.templateId, drillName: drillTemplates.find(t => t.id === newDrill.templateId)?.name ?? "", timeSeconds: "", hits: "", totalShots: "", score: "", notes: "", passFail: "PASS" });
                          setAddingDrill(false);
                        }}
                        className="px-4 py-1.5 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50">
                        Add
                      </button>
                      <button type="button" onClick={() => setAddingDrill(false)}
                        className="px-4 py-1.5 rounded-md border border-vault-border text-vault-text-muted text-sm hover:bg-vault-border transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => setAddingDrill(true)}
                    className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-vault-border text-vault-text-faint text-sm hover:border-[#00C2FF]/40 hover:text-[#00C2FF] transition-colors w-full justify-center">
                    <Plus className="w-4 h-4" />
                    Add Drill
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Session Note */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-sm font-semibold text-[#00C2FF] px-1 -ml-1">
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
              {hasAmmoDeduction && (
                <p>
                  Will deduct {formatNumber(totalAmmoToDeduct)} rounds across ammo selection
                  {totalEnteredRounds > 0 && totalAmmoToDeduct > totalEnteredRounds ? " (exceeds rounds fired)" : ""}
                </p>
              )}
            </div>
            <button type="submit" disabled={submitting || selectedFirearmIds.length === 0 || selectedFirearmIds.some((id) => !(parseInt(roundsByFirearm[id] ?? "", 10) > 0))}
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
