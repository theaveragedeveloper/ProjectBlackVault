"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import { Target, ChevronDown, Loader2, AlertCircle, CheckCircle2, Shield, Timer, BookPlus, Plus, Minus, Calculator } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";
const SECTION_CARD_CLASS = "bg-vault-surface border border-vault-border rounded-lg p-4 sm:p-5 space-y-4";

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

interface AmmoSelection {
  ammoStockId: string;
  roundsUsed: string;
}

interface SessionDrill {
  id: string;
  name: string;
  setNumber: number;
  timeSeconds: number;
  points: number;
  penalties: number | null;
  hits: number | null;
  hitFactor: number;
  notes: string | null;
  createdAt: string;
}

interface RangeSession {
  id: string;
  sessionDate: string;
  location: string;
  roundsFired: number;
  notes: string | null;
  firearm: { id: string; name: string; caliber: string };
  build: { id: string; name: string } | null;
  ammoLinks: Array<{
    id: string;
    roundsUsed: number;
    ammoStock: {
      id: string;
      caliber: string;
      brand: string;
      grainWeight: number | null;
      bulletType: string | null;
    };
  }>;
  sessionDrills: SessionDrill[];
}

interface DrillEntryDraft {
  id: string;
  name: string;
  timeSeconds: string;
  points: string;
  penalties: string;
  hits: string;
  notes: string;
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

const HIT_CARD_STYLES: Record<"alpha" | "charlie" | "delta" | "steel", string> = {
  alpha: "border-[#00C2FF]/40 bg-[#00C2FF]/10",
  charlie: "border-[#7CFF6B]/35 bg-[#7CFF6B]/10",
  delta: "border-[#F5A623]/35 bg-[#F5A623]/10",
  steel: "border-[#D06BFF]/35 bg-[#D06BFF]/10",
};

function calculateHitFactor(points: number, timeSeconds: number) {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return 0;
  if (!Number.isFinite(points) || points < 0) return 0;
  return Number((points / timeSeconds).toFixed(4));
}

export type RangeRouteView = "log-session" | "session-history" | "log-drill" | "drill-performance" | "drill-library" | "hit-factor";

interface RangeWorkspaceProps {
  view: RangeRouteView;
}

type PowerFactorMode = "minor" | "major";

export function RangeWorkspace({ view }: RangeWorkspaceProps) {
  const isDrillPage = view === "log-drill" || view === "drill-performance" || view === "drill-library" || view === "hit-factor";
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoStocks, setAmmoStocks] = useState<AmmoStock[]>([]);
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [sessionDrills, setSessionDrills] = useState<SessionDrill[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [roundsFired, setRoundsFired] = useState<string>("");
  const [ammoSelections, setAmmoSelections] = useState<AmmoSelection[]>([{ ammoStockId: "", roundsUsed: "" }]);
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionLocation, setSessionLocation] = useState<string>("");
  const [sessionNote, setSessionNote] = useState<string>("");
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(new Set());
  const [sessionDrillEntries, setSessionDrillEntries] = useState<DrillEntryDraft[]>([
    { id: crypto.randomUUID(), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" },
  ]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [drillName, setDrillName] = useState<string>("");
  const [drillTime, setDrillTime] = useState<string>("");
  const [drillPoints, setDrillPoints] = useState<string>("");
  const [drillPenalties, setDrillPenalties] = useState<string>("");
  const [drillHits, setDrillHits] = useState<string>("");
  const [drillNotes, setDrillNotes] = useState<string>("");
  const [customDrillName, setCustomDrillName] = useState("");
  const [customDrillNotes, setCustomDrillNotes] = useState("");
  const [customDrills, setCustomDrills] = useState<Array<{ id: string; name: string; notes: string | null; createdAt: string }>>([]);
  const [calculatorPoints, setCalculatorPoints] = useState("");
  const [calculatorPenalties, setCalculatorPenalties] = useState("");
  const [calculatorTime, setCalculatorTime] = useState("");
  const [powerFactor, setPowerFactor] = useState<PowerFactorMode>("minor");
  const [bulletWeight, setBulletWeight] = useState("");
  const [muzzleVelocity, setMuzzleVelocity] = useState("");
  const [pfComputedValue, setPfComputedValue] = useState<number | null>(null);
  const [hitCounts, setHitCounts] = useState({ alpha: 0, charlie: 0, delta: 0, steel: 0 });
  const [penaltyCounts, setPenaltyCounts] = useState({ miss: 0, noShoot: 0, procedural: 0 });
  const [performanceMetric, setPerformanceMetric] = useState<"time" | "score" | "hitFactor">("hitFactor");
  const [performanceDrillName, setPerformanceDrillName] = useState("");

  const [loadingFirearms, setLoadingFirearms] = useState(true);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [loadingAmmo, setLoadingAmmo] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDrills, setLoadingDrills] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittingDrill, setSubmittingDrill] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [finalizeState, setFinalizeState] = useState<"idle" | "success" | "failed_after_save">("idle");
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/range/sessions");
      const data = (await res.json()) as RangeSession[];
      if (res.ok) {
        setSessions(data);
        if (!selectedSessionId && data.length > 0) {
          setSelectedSessionId(data[0].id);
        }
      }
    } finally {
      setLoadingSessions(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    fetch("/api/firearms")
      .then((r) => r.json())
      .then((data) => {
        setFirearms(data);
        setLoadingFirearms(false);
      })
      .catch(() => setLoadingFirearms(false));

    fetch("/api/ammo")
      .then((r) => r.json())
      .then((data) => {
        setAmmoStocks(data.all ?? []);
        setLoadingAmmo(false);
      })
      .catch(() => setLoadingAmmo(false));

    void loadSessions();
  }, [loadSessions]);

  const loadBuilds = useCallback(async (firearmId: string) => {
    if (!firearmId) {
      setBuilds([]);
      return;
    }

    setLoadingBuilds(true);
    try {
      const res = await fetch(`/api/builds?firearmId=${firearmId}`);
      const data = (await res.json()) as Build[];
      setBuilds(data);

      const active = data.find((b) => b.isActive);
      if (active) {
        setSelectedBuild(active.id);
        const autoSelect = new Set<string>();
        for (const slot of active.slots) {
          if (slot.accessory) autoSelect.add(slot.accessory.id);
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
      void loadBuilds(selectedFirearm);
    } else {
      setBuilds([]);
      setSelectedBuild("");
    }
  }, [selectedFirearm, loadBuilds]);

  useEffect(() => {
    const build = builds.find((b) => b.id === selectedBuild);
    if (!build) return;
    const autoSelect = new Set<string>();
    for (const slot of build.slots) {
      if (slot.accessory) autoSelect.add(slot.accessory.id);
    }
    setSelectedAccessories(autoSelect);
  }, [selectedBuild, builds]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSessionDrills([]);
      return;
    }

    setLoadingDrills(true);
    fetch(`/api/range/sessions/${selectedSessionId}/drills`)
      .then((r) => r.json())
      .then((data) => {
        setSessionDrills(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingDrills(false));
  }, [selectedSessionId]);

  useEffect(() => {
    if (sessions.length === 0) {
      if (selectedSessionId) setSelectedSessionId("");
      return;
    }

    const stillExists = sessions.some((session) => session.id === selectedSessionId);
    if (!stillExists) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("blackvault-custom-drills");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ id: string; name: string; notes: string | null; createdAt: string }>;
      if (Array.isArray(parsed)) {
        setCustomDrills(parsed.filter((item) => typeof item.id === "string" && typeof item.name === "string"));
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("blackvault-custom-drills", JSON.stringify(customDrills));
  }, [customDrills]);

  const selectedFirearmData = firearms.find((f) => f.id === selectedFirearm);
  const selectedBuildData = builds.find((b) => b.id === selectedBuild);
  const buildAccessories = selectedBuildData?.slots.filter((s) => s.accessory) ?? [];

  const compatibleAmmo = selectedFirearmData
    ? ammoStocks.filter((a) => a.caliber === selectedFirearmData.caliber)
    : ammoStocks;

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  const drillHitFactorPreview = useMemo(() => {
    const time = Number.parseFloat(drillTime);
    const points = Number.parseFloat(drillPoints);
    const penalties = Number.parseFloat(drillPenalties || "0");
    const adjustedPoints = Number.isFinite(points) ? Math.max(0, points - (Number.isFinite(penalties) ? penalties : 0)) : 0;
    return calculateHitFactor(adjustedPoints, time);
  }, [drillTime, drillPoints, drillPenalties]);

  const nextSetNumberForSelectedDrill = useMemo(() => {
    const normalizedName = drillName.trim().toLowerCase();
    if (!normalizedName) return 1;
    const existingCount = sessionDrills.filter((entry) => entry.name.trim().toLowerCase() === normalizedName).length;
    return existingCount + 1;
  }, [drillName, sessionDrills]);

  function updateAmmoSelection(index: number, next: Partial<AmmoSelection>) {
    setAmmoSelections((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item)));
  }

  function addAmmoSelection() {
    setAmmoSelections((prev) => [...prev, { ammoStockId: "", roundsUsed: "" }]);
  }

  function removeAmmoSelection(index: number) {
    setAmmoSelections((prev) => (prev.length <= 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)));
  }

  function updateSessionDrillEntry(entryId: string, next: Partial<DrillEntryDraft>) {
    setSessionDrillEntries((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, ...next } : entry)));
  }

  function addSessionDrillEntry() {
    setSessionDrillEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" },
    ]);
  }

  function removeSessionDrillEntry(entryId: string) {
    setSessionDrillEntries((prev) => {
      if (prev.length <= 1) {
        return [{ ...prev[0], name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" }];
      }
      return prev.filter((entry) => entry.id !== entryId);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setWarning(null);
    setFinalizeState("idle");
    setSavedSessionId(null);
    setSubmitting(true);

    const normalizedAmmoLinks = ammoSelections
      .map((selection) => ({
        ammoStockId: selection.ammoStockId,
        roundsUsed: Number.parseInt(selection.roundsUsed, 10),
      }))
      .filter((selection) => selection.ammoStockId && Number.isInteger(selection.roundsUsed) && selection.roundsUsed > 0);
    const drillSetCounter = new Map<string, number>();
    const normalizedSessionDrills = sessionDrillEntries.flatMap((entry, index) => {
      const name = entry.name.trim();
      const timeSeconds = Number.parseFloat(entry.timeSeconds);
      const points = Number.parseFloat(entry.points);
      const penalties = Number.parseFloat(entry.penalties || "0");
      const hits = Number.parseInt(entry.hits, 10);

      if (!name && !entry.timeSeconds && !entry.points && !entry.penalties && !entry.hits && !entry.notes.trim()) {
        return [];
      }

      if (!name || !Number.isFinite(timeSeconds) || timeSeconds <= 0 || !Number.isFinite(points) || points < 0) {
        return [];
      }

      const setNumber = (drillSetCounter.get(name) ?? 0) + 1;
      drillSetCounter.set(name, setNumber);

      return [{
        name,
        setNumber,
        timeSeconds,
        points,
        penalties: Number.isFinite(penalties) && penalties >= 0 ? penalties : undefined,
        hits: Number.isInteger(hits) && hits >= 0 ? hits : undefined,
        notes: entry.notes.trim() || undefined,
        sortOrder: index,
      }];
    });

    const ammoRoundsTotal = normalizedAmmoLinks.reduce((sum, selection) => sum + selection.roundsUsed, 0);
    const explicitRounds = Number.parseInt(roundsFired, 10);
    const resolvedRounds = Number.isInteger(explicitRounds) && explicitRounds >= 0 ? explicitRounds : ammoRoundsTotal;
    const selectedFirearmId = selectedFirearm || firearms[0]?.id || "";
    const accessoryIdsForFinalize = selectedBuildData?.slots
      .map((slot) => slot.accessory?.id)
      .filter((id): id is string => Boolean(id)) ?? [];

    if (!selectedFirearmId) {
      setError("Add at least one firearm in the vault before logging a range session.");
      setSubmitting(false);
      return;
    }

    const hasIncompleteDrillRows = sessionDrillEntries.some((entry) => {
      const hasAnyValue = Boolean(entry.name.trim() || entry.timeSeconds || entry.points || entry.penalties || entry.hits || entry.notes.trim());
      if (!hasAnyValue) return false;
      const hasRequired = Boolean(entry.name.trim() && entry.timeSeconds && entry.points);
      return !hasRequired;
    });
    if (hasIncompleteDrillRows) {
      setError("Each drill set row must include drill name, time, and points (or leave the row blank).");
      setSubmitting(false);
      return;
    }

    for (const ammoLink of normalizedAmmoLinks) {
      const selectedAmmoData = ammoStocks.find((stock) => stock.id === ammoLink.ammoStockId);
      if (!selectedAmmoData) {
        setError("One or more selected ammo stocks are invalid.");
        setSubmitting(false);
        return;
      }

      if (selectedAmmoData.quantity < ammoLink.roundsUsed) {
        setError(`Insufficient ammo in selected stock. Available: ${formatNumber(selectedAmmoData.quantity)} rounds.`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const sessionRes = await fetch("/api/range/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: sessionDate || new Date().toISOString().slice(0, 10),
          location: sessionLocation || "Unspecified location",
          firearmId: selectedFirearmId,
          buildId: selectedBuild || null,
          roundsFired: resolvedRounds,
          notes: sessionNote,
          ammoLinks: normalizedAmmoLinks,
          sessionDrills: normalizedSessionDrills,
        }),
      });

      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionJson.error ?? "Failed to create range session");
      }

      setSavedSessionId(sessionJson.id);

      const finalizeRes = await fetch(`/api/range/sessions/${sessionJson.id}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedAccessoryIds: accessoryIdsForFinalize.length > 0 ? accessoryIdsForFinalize : Array.from(selectedAccessories),
        }),
      });

      const finalizeJson = await finalizeRes.json();
      if (!finalizeRes.ok) {
        setFinalizeState("failed_after_save");
        setSuccess("Session saved.");
        setWarning("Finalize failed. Retry save to safely re-run updates.");
        setError(finalizeJson.error ?? "Finalize failed");
        await loadSessions();
        setSelectedSessionId(sessionJson.id);
        setSubmitting(false);
        return;
      }

      await loadSessions();
      setSelectedSessionId(sessionJson.id);
      setFinalizeState("success");
      setSuccess("Session saved and finalized.");
      setWarning(null);
      setRoundsFired("");
      setSessionNote("");
      setAmmoSelections([{ ammoStockId: "", roundsUsed: "" }]);
      setSessionDrillEntries([{ id: crypto.randomUUID(), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" }]);
    } catch (err) {
      setFinalizeState("idle");
      setError(err instanceof Error ? err.message : "Session log failed");
      setWarning(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddDrill(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSessionId) return;

    setError(null);
    setSuccess(null);
    setWarning(null);
    setSubmittingDrill(true);

    try {
      const payload = {
        name: drillName,
        setNumber: nextSetNumberForSelectedDrill,
        timeSeconds: Number.parseFloat(drillTime),
        points: Number.parseFloat(drillPoints),
        penalties: drillPenalties ? Number.parseFloat(drillPenalties) : undefined,
        hits: drillHits ? Number.parseInt(drillHits, 10) : undefined,
        notes: drillNotes,
      };

      const res = await fetch(`/api/range/sessions/${selectedSessionId}/drills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to add drill");
      }

      const drillsRes = await fetch(`/api/range/sessions/${selectedSessionId}/drills`);
      const drillsJson = await drillsRes.json();
      setSessionDrills(Array.isArray(drillsJson) ? drillsJson : []);
      await loadSessions();

      setDrillTime("");
      setDrillPoints("");
      setDrillPenalties("");
      setDrillHits("");
      setSuccess(`Drill set ${nextSetNumberForSelectedDrill} logged successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drill log failed");
    } finally {
      setSubmittingDrill(false);
    }
  }

  const showLogSession = view === "log-session";
  const showSessionHistory = view === "session-history";
  const showLogDrill = view === "log-drill";
  const showDrillPerformance = view === "drill-performance";
  const showDrillLibrary = view === "drill-library";
  const showHitFactor = view === "hit-factor";

  const allLoggedDrills = useMemo(
    () =>
      sessions.flatMap((session) =>
        (session.sessionDrills ?? []).map((drill) => ({
          ...drill,
          sessionDate: session.sessionDate,
          location: session.location,
          sessionId: session.id,
        }))
      ),
    [sessions]
  );

  const drillNameLibrary = useMemo(() => {
    const names = new Set<string>();
    for (const drill of allLoggedDrills) {
      if (drill.name.trim()) names.add(drill.name.trim());
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allLoggedDrills]);

  useEffect(() => {
    if (drillNameLibrary.length === 0) {
      setPerformanceDrillName("");
      return;
    }

    if (!performanceDrillName || !drillNameLibrary.includes(performanceDrillName)) {
      setPerformanceDrillName(drillNameLibrary[0]);
    }
  }, [drillNameLibrary, performanceDrillName]);

  const performanceRows = useMemo(() => {
    const filtered = performanceDrillName
      ? allLoggedDrills.filter((drill) => drill.name.trim() === performanceDrillName)
      : allLoggedDrills;

    const sorted = [...filtered]
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
      .slice(-30);

    const metricValueFor = (drill: (typeof sorted)[number]) => {
      if (performanceMetric === "time") return drill.timeSeconds;
      if (performanceMetric === "score") return Math.max(0, drill.points - (drill.penalties ?? 0));
      return drill.hitFactor;
    };

    const maxMetricValue = sorted.reduce((max, drill) => Math.max(max, metricValueFor(drill)), 0);

    return sorted.map((drill) => ({
      ...drill,
      metricValue: metricValueFor(drill),
      barWidth: maxMetricValue > 0 ? Math.max(6, Math.round((metricValueFor(drill) / maxMetricValue) * 100)) : 0,
    }));
  }, [allLoggedDrills, performanceDrillName, performanceMetric]);

  const pointsPerHit = powerFactor === "major"
    ? { alpha: 5, charlie: 4, delta: 2, steel: 5 }
    : { alpha: 5, charlie: 3, delta: 1, steel: 5 };

  const hitPoints = (hitCounts.alpha * pointsPerHit.alpha)
    + (hitCounts.charlie * pointsPerHit.charlie)
    + (hitCounts.delta * pointsPerHit.delta)
    + (hitCounts.steel * pointsPerHit.steel);

  const penaltyPoints = (penaltyCounts.miss * 10)
    + (penaltyCounts.noShoot * 10)
    + (penaltyCounts.procedural * 10);

  const calculatorBasePoints = Number.parseFloat(calculatorPoints) || 0;
  const calculatorPenaltyInput = Number.parseFloat(calculatorPenalties) || 0;
  const calculatorTotalPoints = hitPoints + calculatorBasePoints;
  const calculatorAdjustedPoints = Math.max(0, calculatorTotalPoints - penaltyPoints - calculatorPenaltyInput);
  const calculatorHitFactor = calculateHitFactor(calculatorAdjustedPoints, Number.parseFloat(calculatorTime));

  function updateHitCount(key: keyof typeof hitCounts, delta: number) {
    setHitCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  }

  function updatePenaltyCount(key: keyof typeof penaltyCounts, delta: number) {
    setPenaltyCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  }

  function calculatePowerFactor() {
    const grain = Number.parseFloat(bulletWeight);
    const velocity = Number.parseFloat(muzzleVelocity);
    if (!Number.isFinite(grain) || !Number.isFinite(velocity) || grain <= 0 || velocity <= 0) {
      setPfComputedValue(null);
      return;
    }

    const computed = Number(((grain * velocity) / 1000).toFixed(2));
    setPfComputedValue(computed);
    setPowerFactor(computed >= 165 ? "major" : "minor");
  }

  function addCustomDrill(e: React.FormEvent) {
    e.preventDefault();
    const name = customDrillName.trim();
    if (!name) return;

    setCustomDrills((prev) => [
      {
        id: crypto.randomUUID(),
        name,
        notes: customDrillNotes.trim() || null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setCustomDrillName("");
    setCustomDrillNotes("");
  }

  const pageTitle = ({
    "log-session": "RANGE · LOG SESSION",
    "session-history": "RANGE · SESSION HISTORY",
    "log-drill": "RANGE · LOG DRILL",
    "drill-performance": "RANGE · DRILL PERFORMANCE",
    "drill-library": "RANGE · DRILL LIBRARY",
    "hit-factor": "RANGE · HIT FACTOR",
  } as const)[view];

  return (
    <div className="min-h-full">
      <PageHeader
        title={pageTitle}
        subtitle="Range session logging, drill tracking, and practical analysis tools"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-[#00C853]/10 border border-[#00C853]/30 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
            <p className="text-sm text-[#00C853]">{success}</p>
          </div>
        )}

        {warning && (
          <div className="flex items-center gap-3 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 text-[#F5A623] shrink-0" />
            <p className="text-sm text-[#F5A623]">{warning}</p>
          </div>
        )}

        {finalizeState === "failed_after_save" && savedSessionId && (
          <div className="bg-vault-surface border border-vault-border rounded-lg px-4 py-3">
            <p className="text-xs text-vault-text-faint uppercase tracking-widest mb-1">Finalize status</p>
            <p className="text-sm text-vault-text-muted">
              Session <span className="font-mono text-vault-text">{savedSessionId.slice(0, 12)}</span> saved, but finalize did not complete.
            </p>
          </div>
        )}

        {finalizeState === "success" && savedSessionId && (
          <div className="bg-vault-surface border border-[#00C853]/30 rounded-lg px-4 py-3">
            <p className="text-xs text-vault-text-faint uppercase tracking-widest mb-1">Finalize status</p>
            <p className="text-sm text-[#00C853]">
              Finalize complete for session <span className="font-mono">{savedSessionId.slice(0, 12)}</span>.
            </p>
          </div>
        )}

        {showLogSession && (
        <form id="log-range-session" onSubmit={handleSubmit} className="space-y-6 scroll-mt-20">
          <fieldset className={SECTION_CARD_CLASS}>
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Session Details</legend>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Session Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Location</label>
                <input
                  type="text"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  placeholder="e.g. Oak Ridge Sportsmen Club"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Firearm</label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedFirearm}
                    onChange={(e) => {
                      setSelectedFirearm(e.target.value);
                      setSelectedBuild("");
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="">Auto-select first firearm</option>
                    {firearms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.caliber})</option>
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
                  <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
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

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Rounds Fired</label>
                <input
                  type="number"
                  min={0}
                  value={roundsFired}
                  onChange={(e) => setRoundsFired(e.target.value)}
                  placeholder="Optional (auto-sums ammo rows)"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className={LABEL_CLASS}>Ammo Used (multiple types supported)</label>
                <button
                  type="button"
                  onClick={addAmmoSelection}
                  className="px-2.5 py-1.5 rounded-md text-xs border border-[#00C2FF]/30 text-[#00C2FF] bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20"
                >
                  Add Ammo Type
                </button>
              </div>
              {loadingAmmo ? (
                <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" /></div>
              ) : (
                ammoSelections.map((selection, index) => (
                  <div key={`ammo-selection-${index}`} className="grid sm:grid-cols-[1fr_160px_auto] gap-2">
                    <div className="relative">
                      <select
                        value={selection.ammoStockId}
                        onChange={(e) => updateAmmoSelection(index, { ammoStockId: e.target.value })}
                        className={INPUT_CLASS}
                      >
                        <option value="">No ammo selected</option>
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
                      min={0}
                      value={selection.roundsUsed}
                      onChange={(e) => updateAmmoSelection(index, { roundsUsed: e.target.value })}
                      placeholder="Rounds"
                      className={INPUT_CLASS}
                    />
                    <button
                      type="button"
                      onClick={() => removeAmmoSelection(index)}
                      disabled={ammoSelections.length === 1}
                      className="px-2.5 py-2 rounded-md text-xs border border-vault-border text-vault-text-faint hover:text-vault-text disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
              <p className="text-xs text-vault-text-faint">Leave rows blank to skip ammo deductions. When rounds fired is blank, it auto-calculates from ammo rows.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className={LABEL_CLASS}>Drills Completed During This Session</label>
                <button
                  type="button"
                  onClick={addSessionDrillEntry}
                  className="px-2.5 py-1.5 rounded-md text-xs border border-[#00C2FF]/30 text-[#00C2FF] bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20"
                >
                  Add Drill Set
                </button>
              </div>
              <p className="text-xs text-vault-text-faint">Add zero, one, or many drill sets. Repeat the same drill name for multiple attempts (Set 1, Set 2, Set 3...).</p>
              {sessionDrillEntries.map((entry, index) => (
                <div key={entry.id} className="rounded-md border border-vault-border bg-vault-bg p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-widest text-vault-text-muted">Set {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeSessionDrillEntry(entry.id)}
                      className="px-2.5 py-1.5 rounded-md text-xs border border-vault-border text-vault-text-faint hover:text-vault-text"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLASS}>Drill Name</label>
                      <input
                        value={entry.name}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { name: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="e.g. Bill Drill"
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Time (seconds)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={entry.timeSeconds}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { timeSeconds: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="2.45"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className={LABEL_CLASS}>Points</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.points}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { points: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="90"
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Penalties</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.penalties}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { penalties: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Hits</label>
                      <input
                        type="number"
                        min="0"
                        value={entry.hits}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { hits: e.target.value })}
                        className={INPUT_CLASS}
                        placeholder="6"
                      />
                    </div>
                    <div className="bg-vault-surface border border-vault-border rounded-md px-3 py-2">
                      <p className="text-[11px] text-vault-text-faint uppercase tracking-widest">Hit Factor</p>
                      <p className="text-lg font-mono text-[#00C2FF]">
                        {calculateHitFactor(
                          Math.max(0, (Number.parseFloat(entry.points) || 0) - (Number.parseFloat(entry.penalties) || 0)),
                          Number.parseFloat(entry.timeSeconds)
                        ).toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Set Notes</label>
                    <textarea
                      rows={2}
                      value={entry.notes}
                      onChange={(e) => updateSessionDrillEntry(entry.id, { notes: e.target.value })}
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <textarea
                rows={3}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="e.g. Match prep and transition work"
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {selectedBuildData && buildAccessories.length > 0 && (
            <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-4 sm:p-5 space-y-3">
              <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Build Accessory Round Attribution</legend>
              <p className="text-xs text-vault-text-faint">All accessories on the selected build will receive this session&apos;s round count.</p>
              <div className="space-y-2">
                {buildAccessories.map((slot) => {
                  if (!slot.accessory) return null;

                  return (
                    <div key={slot.id} className="flex items-center gap-3 p-3 rounded-md border bg-vault-bg border-vault-border">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-vault-text truncate">{slot.accessory.name}</p>
                          <span className="text-[10px] text-[#00C2FF] border border-[#00C2FF]/30 px-1.5 py-0.5 rounded font-mono">included</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-vault-text-faint">
                          <span>{SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}</span>
                          <span>·</span>
                          <span className="font-mono text-vault-text-muted">{formatNumber(slot.accessory.roundCount)} rds total</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          )}

          {selectedBuild && buildAccessories.length === 0 && (
            <div className="bg-vault-surface border border-vault-border rounded-lg p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-vault-text-faint" />
                <p className="text-sm text-vault-text-muted">This build has no accessories installed.</p>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {submitting ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>
        )}

        {isDrillPage && (
        <fieldset className={SECTION_CARD_CLASS}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Session Selector</legend>
          <div>
            <label className={LABEL_CLASS}>Session</label>
            <div className="relative">
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className={INPUT_CLASS}
                disabled={loadingSessions || sessions.length === 0}
              >
                <option value="">Select session...</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {new Date(session.sessionDate).toLocaleDateString()} · {session.location} · {session.firearm.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
            </div>
          </div>
        </fieldset>
        )}

        {showLogDrill && (
        <fieldset id="log-a-drill" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Log Drill Results</legend>

          <form onSubmit={handleAddDrill} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Drill Name <span className="text-[#E53935]">*</span></label>
                <input required value={drillName} onChange={(e) => setDrillName(e.target.value)} className={INPUT_CLASS} placeholder="e.g. Bill Drill" />
                {selectedSessionId && drillName.trim() && (
                  <p className="mt-1 text-xs text-vault-text-faint">This will be saved as set {nextSetNumberForSelectedDrill} for this drill in the selected session.</p>
                )}
              </div>
              <div>
                <label className={LABEL_CLASS}>Time (seconds) <span className="text-[#E53935]">*</span></label>
                <input type="number" step="0.01" min="0.01" required value={drillTime} onChange={(e) => setDrillTime(e.target.value)} className={INPUT_CLASS} placeholder="2.45" />
              </div>
            </div>

            <div id="hit-factor-calculator" className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 scroll-mt-20">
              <div>
                <label className={LABEL_CLASS}>Points <span className="text-[#E53935]">*</span></label>
                <input type="number" step="0.01" min="0" required value={drillPoints} onChange={(e) => setDrillPoints(e.target.value)} className={INPUT_CLASS} placeholder="90" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Penalties</label>
                <input type="number" step="0.01" min="0" value={drillPenalties} onChange={(e) => setDrillPenalties(e.target.value)} className={INPUT_CLASS} placeholder="10" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Hits</label>
                <input type="number" min="0" value={drillHits} onChange={(e) => setDrillHits(e.target.value)} className={INPUT_CLASS} placeholder="6" />
              </div>
              <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2">
                <p className="text-[11px] text-vault-text-faint uppercase tracking-widest">Hit Factor</p>
                <p className="text-lg font-mono text-[#00C2FF]">{drillHitFactorPreview.toFixed(4)}</p>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Drill Notes</label>
              <textarea rows={2} value={drillNotes} onChange={(e) => setDrillNotes(e.target.value)} className={`${INPUT_CLASS} resize-none`} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingDrill || !selectedSessionId}
                className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {submittingDrill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
                {submittingDrill ? "Saving..." : "Add Drill"}
              </button>
            </div>
          </form>
        </fieldset>
        )}

        {showDrillPerformance && (
        <fieldset id="drill-performance" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Drill Performance Graph</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Drill</label>
              <div className="relative">
                <select
                  value={performanceDrillName}
                  onChange={(e) => setPerformanceDrillName(e.target.value)}
                  className={INPUT_CLASS}
                  disabled={drillNameLibrary.length === 0}
                >
                  {drillNameLibrary.length === 0 ? (
                    <option value="">No drills available</option>
                  ) : (
                    drillNameLibrary.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>History Metric</label>
              <div className="relative">
                <select
                  value={performanceMetric}
                  onChange={(e) => setPerformanceMetric(e.target.value as "time" | "score" | "hitFactor")}
                  className={INPUT_CLASS}
                >
                  <option value="time">Time (sec)</option>
                  <option value="score">Score (points - penalties)</option>
                  <option value="hitFactor">Hit Factor</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
              </div>
            </div>
          </div>

          {performanceRows.length === 0 ? (
            <p className="text-sm text-vault-text-faint">No historical data for the selected drill yet.</p>
          ) : (
            <div className="space-y-2">
              {performanceRows.map((drill) => (
                <div key={drill.id} className="bg-vault-bg border border-vault-border rounded-md p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <p className="text-vault-text font-medium">{drill.name}</p>
                    <p className="font-mono text-[#00C2FF]">
                      {performanceMetric === "time"
                        ? `${drill.metricValue.toFixed(2)}s`
                        : performanceMetric === "score"
                          ? `${drill.metricValue.toFixed(2)} pts`
                          : `HF ${drill.metricValue.toFixed(4)}`}
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded bg-vault-border overflow-hidden">
                    <div className="h-full rounded bg-[#00C2FF]" style={{ width: `${drill.barWidth}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-vault-text-faint">
                    {new Date(drill.sessionDate).toLocaleDateString()} · {drill.location} · {drill.points} pts in {drill.timeSeconds}s
                  </p>
                </div>
              ))}
            </div>
          )}
        </fieldset>
        )}

        {showDrillLibrary && (
        <fieldset id="drill-library" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Drill Library</legend>
          <form onSubmit={addCustomDrill} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
            <div>
              <label className={LABEL_CLASS}>Custom Drill Name</label>
              <input
                value={customDrillName}
                onChange={(e) => setCustomDrillName(e.target.value)}
                placeholder="e.g. El Prez"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Notes</label>
              <input
                value={customDrillNotes}
                onChange={(e) => setCustomDrillNotes(e.target.value)}
                placeholder="Optional setup notes"
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20"
            >
              <span className="inline-flex items-center gap-2"><BookPlus className="w-4 h-4" />Add Drill</span>
            </button>
          </form>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-vault-text-muted">Logged Drill Names</p>
              {drillNameLibrary.length === 0 ? (
                <p className="text-sm text-vault-text-faint">No logged drill names yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {drillNameLibrary.map((name) => (
                    <div key={name} className="text-sm text-vault-text bg-vault-bg border border-vault-border rounded px-3 py-2">{name}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-vault-text-muted">Custom Drills</p>
              {customDrills.length === 0 ? (
                <p className="text-sm text-vault-text-faint">No custom drills added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {customDrills.map((drill) => (
                    <div key={drill.id} className="bg-vault-bg border border-vault-border rounded px-3 py-2">
                      <p className="text-sm text-vault-text">{drill.name}</p>
                      {drill.notes && <p className="text-xs text-vault-text-faint mt-1">{drill.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </fieldset>
        )}

        {showHitFactor && (
        <section id="hit-factor-calculator" className="space-y-4 scroll-mt-20">
          <header className="space-y-1 px-1">
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-vault-text">HIT FACTOR CALCULATOR</h2>
            <p className="text-sm text-vault-text-muted">USPSA / IPSC stage scoring — points per second</p>
          </header>

          <div className="bg-vault-surface border border-vault-border rounded-xl p-4 space-y-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#00C2FF] font-mono">Formula</p>
            <p className="text-sm text-vault-text">Hit Factor = <span className="font-semibold text-vault-text">Adjusted Points</span> ÷ <span className="font-semibold text-vault-text">Time (sec)</span></p>
            <p className="text-xs text-vault-text-faint">Adjusted Points = Hit Points + Extra Points − Penalties. Minor/Major changes Charlie and Delta values.</p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-xl p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-vault-text-muted">Power Factor</p>
                <div className="inline-flex w-full sm:w-auto rounded-lg border border-vault-border bg-vault-bg p-1">
                  <button
                    type="button"
                    onClick={() => setPowerFactor("minor")}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors min-w-24 ${powerFactor === "minor" ? "bg-[#00C2FF]/20 text-[#00C2FF] border border-[#00C2FF]/35" : "text-vault-text-muted"}`}
                  >
                    Minor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPowerFactor("major")}
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors min-w-24 ${powerFactor === "major" ? "bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/35" : "text-vault-text-muted"}`}
                  >
                    Major
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 w-full sm:w-auto sm:min-w-[320px]">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={bulletWeight}
                  onChange={(e) => setBulletWeight(e.target.value)}
                  placeholder="gr"
                  className={INPUT_CLASS}
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={muzzleVelocity}
                  onChange={(e) => setMuzzleVelocity(e.target.value)}
                  placeholder="fps"
                  className={INPUT_CLASS}
                />
                <button
                  type="button"
                  onClick={calculatePowerFactor}
                  className="px-3 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm font-medium whitespace-nowrap"
                >
                  Calculate PF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-lg border border-vault-border bg-vault-bg px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wider text-vault-text-faint">Alpha</p>
                <p className="text-sm font-semibold text-vault-text">{pointsPerHit.alpha} pts</p>
              </div>
              <div className="rounded-lg border border-vault-border bg-vault-bg px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wider text-vault-text-faint">Charlie</p>
                <p className="text-sm font-semibold text-vault-text">{pointsPerHit.charlie} pts</p>
              </div>
              <div className="rounded-lg border border-vault-border bg-vault-bg px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wider text-vault-text-faint">Delta</p>
                <p className="text-sm font-semibold text-vault-text">{pointsPerHit.delta} pts</p>
              </div>
              <div className="rounded-lg border border-vault-border bg-vault-bg px-3 py-2 text-center">
                <p className="text-[11px] uppercase tracking-wider text-vault-text-faint">Steel</p>
                <p className="text-sm font-semibold text-vault-text">{pointsPerHit.steel} pts</p>
              </div>
            </div>

            <p className="text-xs text-vault-text-faint">
              {pfComputedValue == null
                ? "Tip: enter grain and velocity to auto-select Minor/Major based on PF."
                : `Computed PF: ${pfComputedValue.toFixed(2)} (${pfComputedValue >= 165 ? "Major" : "Minor"})`}
            </p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-xl p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-vault-text-muted">Hits</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { key: "alpha", label: "Alpha", points: pointsPerHit.alpha },
                { key: "charlie", label: "Charlie", points: pointsPerHit.charlie },
                { key: "delta", label: "Delta", points: pointsPerHit.delta },
                { key: "steel", label: "Steel", points: pointsPerHit.steel },
              ] as const).map((hitType) => (
                <div key={hitType.key} className={`rounded-xl border p-3 space-y-2 ${HIT_CARD_STYLES[hitType.key]}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-vault-text">{hitType.label}</p>
                    <p className="text-xs text-vault-text-faint">{hitType.points} pts / hit</p>
                  </div>
                  <div className="grid grid-cols-[56px_1fr_56px] gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => updateHitCount(hitType.key, -1)}
                      className="h-12 rounded-lg border border-vault-border bg-vault-bg text-vault-text flex items-center justify-center"
                      aria-label={`Decrease ${hitType.label} hits`}
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="h-12 rounded-lg bg-vault-bg border border-vault-border flex items-center justify-center text-xl font-black text-vault-text">
                      {hitCounts[hitType.key]}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateHitCount(hitType.key, 1)}
                      className="h-12 rounded-lg border border-vault-border bg-vault-bg text-vault-text flex items-center justify-center"
                      aria-label={`Increase ${hitType.label} hits`}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-xl p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-vault-text-muted">Penalties</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                { key: "miss", label: "Miss", amount: 10 },
                { key: "noShoot", label: "No Shoot", amount: 10 },
                { key: "procedural", label: "Procedural", amount: 10 },
              ] as const).map((penalty) => (
                <div key={penalty.key} className="rounded-xl border border-[#E53935]/30 bg-[#E53935]/10 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-vault-text">{penalty.label}</p>
                    <p className="text-xs text-vault-text-faint">-{penalty.amount} pts</p>
                  </div>
                  <div className="grid grid-cols-[48px_1fr_48px] gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => updatePenaltyCount(penalty.key, -1)}
                      className="h-11 rounded-lg border border-vault-border bg-vault-bg text-vault-text flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="h-11 rounded-lg bg-vault-bg border border-vault-border flex items-center justify-center text-lg font-bold text-vault-text">
                      {penaltyCounts[penalty.key]}
                    </div>
                    <button
                      type="button"
                      onClick={() => updatePenaltyCount(penalty.key, 1)}
                      className="h-11 rounded-lg border border-vault-border bg-vault-bg text-vault-text flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>Extra Points</label>
                <input type="number" step="0.01" min="0" value={calculatorPoints} onChange={(e) => setCalculatorPoints(e.target.value)} className={INPUT_CLASS} placeholder="0" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Other Penalties</label>
                <input type="number" step="0.01" min="0" value={calculatorPenalties} onChange={(e) => setCalculatorPenalties(e.target.value)} className={INPUT_CLASS} placeholder="0" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Time (sec)</label>
                <input type="number" step="0.01" min="0.01" value={calculatorTime} onChange={(e) => setCalculatorTime(e.target.value)} className={INPUT_CLASS} placeholder="2.45" />
              </div>
            </div>
          </div>

          <div className="bg-vault-bg border border-[#00C2FF]/35 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#00C2FF]" />
                <p className="text-sm uppercase tracking-wider text-vault-text-muted">Result</p>
              </div>
              <p className="text-3xl font-black font-mono text-[#00C2FF]">{calculatorHitFactor.toFixed(4)}</p>
            </div>
            <div className="mt-3 text-xs text-vault-text-faint grid sm:grid-cols-2 gap-2">
              <p>Hit Points: {hitPoints.toFixed(2)}</p>
              <p>Total Penalties: -{(penaltyPoints + calculatorPenaltyInput).toFixed(2)}</p>
              <p>Total Points: {calculatorTotalPoints.toFixed(2)}</p>
              <p>Adjusted Points: {calculatorAdjustedPoints.toFixed(2)}</p>
            </div>
          </div>
        </section>
        )}

        {showLogDrill && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-vault-text-muted">Recent Drills (Selected Session)</p>
            {loadingDrills ? (
              <div className="flex items-center gap-2 text-sm text-vault-text-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading drills...</div>
            ) : sessionDrills.length === 0 ? (
              <p className="text-sm text-vault-text-faint">No drills logged yet for this session.</p>
            ) : (
              <div className="space-y-2">
                {sessionDrills.map((drill) => (
                  <div key={drill.id} className="bg-vault-bg border border-vault-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-vault-text">{drill.name} · Set {drill.setNumber}</p>
                      <p className="text-xs font-mono text-[#00C2FF]">HF {drill.hitFactor.toFixed(4)}</p>
                    </div>
                    <div className="mt-1 text-xs text-vault-text-muted flex flex-wrap gap-3">
                      <span>{drill.points} pts</span>
                      <span>{drill.timeSeconds}s</span>
                      {drill.penalties != null && <span>{drill.penalties} pen</span>}
                      {drill.hits != null && <span>{drill.hits} hits</span>}
                    </div>
                    {drill.notes && <p className="text-xs text-vault-text-faint mt-1">{drill.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showSessionHistory && (
        <fieldset id="range-session-history" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Session History</legend>

          {loadingSessions ? (
            <div className="flex items-center gap-2 text-sm text-vault-text-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-vault-text-faint">No sessions logged yet. Save a range session to start drill history.</p>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 8).map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSessionId(session.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    session.id === selectedSessionId ? "border-[#00C2FF]/50 bg-[#00C2FF]/10" : "border-vault-border bg-vault-bg hover:border-vault-text-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-vault-text">{new Date(session.sessionDate).toLocaleDateString()} · {session.location}</p>
                    <p className="text-xs font-mono text-[#F5A623]">{formatNumber(session.roundsFired)} rds</p>
                  </div>
                  <p className="text-xs text-vault-text-muted mt-1">
                    {session.firearm.name}{session.build ? ` · ${session.build.name}` : ""} · {session.ammoLinks.map((link) => `${link.ammoStock.brand} (${link.roundsUsed})`).join(", ")}
                  </p>
                  {session.sessionDrills.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {session.sessionDrills.map((drill) => (
                        <div key={drill.id} className="text-[11px] text-vault-text-muted flex flex-wrap gap-2">
                          <span className="font-medium text-vault-text">{drill.name}</span>
                          <span>Set {drill.setNumber}</span>
                          <span>·</span>
                          <span>{drill.points} pts</span>
                          <span>in {drill.timeSeconds}s</span>
                          <span className="font-mono text-[#00C2FF]">HF {drill.hitFactor.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedSession?.sessionDrills?.length ? (
            <p className="text-xs text-vault-text-faint">Selected session has {selectedSession.sessionDrills.length} drill set{selectedSession.sessionDrills.length === 1 ? "" : "s"} logged.</p>
          ) : null}
        </fieldset>
        )}
      </div>
    </div>
  );
}
