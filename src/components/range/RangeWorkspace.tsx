"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { VaultInput, VaultSelect, VaultTextArea, vaultCardClass, vaultLabelClass, VaultButton } from "@/components/shared/ui-primitives";
import { formatNumber } from "@/lib/utils";
import { Target, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2, Shield, Timer, BookPlus, Plus, Minus, Calculator, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { safeId } from "@/lib/client/id";
import { inferDrillModeFromEntry, resolveDrillMetrics, type DrillPerformanceMode } from "@/lib/range/drill-metrics";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SECTION_CARD_CLASS = `${vaultCardClass} space-y-4`;

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


interface DrillTemplate {
  id: string;
  name: string;
  notes: string | null;
  mode: DrillPerformanceMode;
  createdAt: string;
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

const DEFAULT_DRILL_LIBRARY: DrillTemplate[] = [
  { id: "bill-drill", name: "Bill Drill", notes: "6 shots from holster at 7 yards", mode: "both", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "draw-to-first-shot", name: "Draw to First Shot", notes: "Pure speed drill", mode: "time", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: "dot-torture", name: "Dot Torture", notes: "Accuracy-focused control drill", mode: "accuracy", createdAt: "2026-01-01T00:00:00.000Z" },
];

export function RangeWorkspace({ view }: RangeWorkspaceProps) {
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
    { id: safeId("session-drill"), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" },
  ]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [drillName, setDrillName] = useState<string>("");
  const [drillTime, setDrillTime] = useState<string>("");
  const [drillPoints, setDrillPoints] = useState<string>("");
  const [drillPenalties, setDrillPenalties] = useState<string>("");
  const [drillHits, setDrillHits] = useState<string>("");
  const [drillNotes, setDrillNotes] = useState<string>("");
  const [customDrillName, setCustomDrillName] = useState("");
  const [customDrillNotes, setCustomDrillNotes] = useState("");
  const [customDrillMode, setCustomDrillMode] = useState<DrillPerformanceMode>("both");
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [deletingDrillId, setDeletingDrillId] = useState<string | null>(null);
  const [drillLibrary, setDrillLibrary] = useState<DrillTemplate[]>(DEFAULT_DRILL_LIBRARY);
  const [calculatorPoints, setCalculatorPoints] = useState("");
  const [calculatorPenalties, setCalculatorPenalties] = useState("");
  const [calculatorTime, setCalculatorTime] = useState("");
  const [powerFactor, setPowerFactor] = useState<PowerFactorMode>("minor");
  const [bulletWeight, setBulletWeight] = useState("");
  const [muzzleVelocity, setMuzzleVelocity] = useState("");
  const [pfComputedValue, setPfComputedValue] = useState<number | null>(null);
  const [hitCounts, setHitCounts] = useState({ alpha: 0, charlie: 0, delta: 0, steel: 0 });
  const [penaltyCounts, setPenaltyCounts] = useState({ miss: 0, noShoot: 0, procedural: 0 });
  const [performanceDrillName, setPerformanceDrillName] = useState("");
  const [selectedPerformanceDrillId, setSelectedPerformanceDrillId] = useState<string>("");
  const router = useRouter();
  const showLogSession = view === "log-session";
  const showSessionHistory = view === "session-history";
  const showLogDrill = view === "log-drill";
  const showDrillPerformance = view === "drill-performance";
  const showDrillLibrary = view === "drill-library";
  const showHitFactor = view === "hit-factor";

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

  // Session history — delete + expand
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Drill library — session counts + notice banner
  const [sessionCountByDrill, setSessionCountByDrill] = useState<Record<string, number>>({});
  const [drillLibNoticeDismissed, setDrillLibNoticeDismissed] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/range/sessions");
      const data = (await res.json()) as RangeSession[] | { error?: string };
      if (res.ok) {
        const safeSessions = Array.isArray(data) ? data : [];
        setSessions(safeSessions);
        if (!selectedSessionId && safeSessions.length > 0) {
          setSelectedSessionId(safeSessions[0].id);
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
        setFirearms(Array.isArray(data) ? data : []);
        setLoadingFirearms(false);
      })
      .catch(() => setLoadingFirearms(false));

    fetch("/api/ammo")
      .then((r) => r.json())
      .then((data) => {
        setAmmoStocks(Array.isArray(data?.all) ? data.all : []);
        setLoadingAmmo(false);
      })
      .catch(() => setLoadingAmmo(false));

    void loadSessions();
  }, [loadSessions]);

  const handleDeleteSession = async (id: string) => {
    setDeletingSessionId(id);
    setDeleteErrorId(null);
    try {
      const res = await fetch(`/api/range/sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        setDeleteErrorId(id);
      }
    } catch {
      setDeleteErrorId(id);
    } finally {
      setDeletingSessionId(null);
      setDeleteConfirmId(null);
    }
  };

  const loadBuilds = useCallback(async (firearmId: string) => {
    if (!firearmId) {
      setBuilds([]);
      return;
    }

    setLoadingBuilds(true);
    try {
      const res = await fetch(`/api/builds?firearmId=${firearmId}`);
      const data = (await res.json()) as Build[];
      const safeBuilds = Array.isArray(data) ? data : [];
      setBuilds(safeBuilds);

      const active = safeBuilds.find((b) => b.isActive);
      if (active) {
        setSelectedBuild(active.id);
        const autoSelect = new Set<string>();
        for (const slot of active.slots) {
          if (slot.accessory) autoSelect.add(slot.accessory.id);
        }
        setSelectedAccessories(autoSelect);
      } else if (safeBuilds.length > 0) {
        setSelectedBuild(safeBuilds[0].id);
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
      const raw = window.localStorage.getItem("blackvault-drill-library");
      if (!raw) return;
      const parsed = JSON.parse(raw) as DrillTemplate[];
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((item) =>
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          (item.mode === "time" || item.mode === "accuracy" || item.mode === "both")
        );
        if (valid.length > 0) setDrillLibrary(valid);
      }
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("blackvault-drill-library", JSON.stringify(drillLibrary));
  }, [drillLibrary]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDrillLibNoticeDismissed(
      localStorage.getItem("bv-drill-lib-notice-dismissed") === "1"
    );
  }, []);

  useEffect(() => {
    if (drillLibrary.length === 0) return;
    Promise.all(
      drillLibrary.map((t) =>
        fetch(`/api/range/drills?name=${encodeURIComponent(t.name)}`)
          .then((r) => r.json())
          .then((data) => ({ name: t.name, count: Array.isArray(data) ? data.length : 0 }))
          .catch(() => ({ name: t.name, count: 0 }))
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach(({ name, count }) => { counts[name] = count; });
      setSessionCountByDrill(counts);
    });
  }, [drillLibrary]);

  const selectedFirearmData = firearms.find((f) => f.id === selectedFirearm);
  const selectedBuildData = builds.find((b) => b.id === selectedBuild);
  const buildAccessories = selectedBuildData?.slots.filter((s) => s.accessory) ?? [];

  const compatibleAmmo = selectedFirearmData
    ? ammoStocks.filter((a) => a.caliber === selectedFirearmData.caliber)
    : ammoStocks;

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;

  const selectedDrillTemplate = useMemo(
    () => drillLibrary.find((template) => template.name === drillName) ?? null,
    [drillLibrary, drillName]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const drillFromQuery = params.get("drill");
    if (drillFromQuery) {
      if (drillFromQuery !== drillName) setDrillName(drillFromQuery);
      if (drillFromQuery !== performanceDrillName) setPerformanceDrillName(drillFromQuery);
    }
    const sessionFromQuery = params.get("sessionId");
    if (sessionFromQuery && sessionFromQuery !== selectedSessionId) setSelectedSessionId(sessionFromQuery);
  }, [drillName, performanceDrillName, selectedSessionId]);

  useEffect(() => {
    if (!showLogSession || typeof window === "undefined") return;
    const editSessionId = new URLSearchParams(window.location.search).get("edit");
    if (!editSessionId) {
      setEditingSessionId(null);
      return;
    }

    const sessionToEdit = sessions.find((session) => session.id === editSessionId);
    if (!sessionToEdit) return;

    setEditingSessionId(sessionToEdit.id);
    setSelectedSessionId(sessionToEdit.id);
    setSessionDate(new Date(sessionToEdit.sessionDate).toISOString().slice(0, 10));
    setSessionLocation(sessionToEdit.location);
    setSelectedFirearm(sessionToEdit.firearm.id);
    setSelectedBuild(sessionToEdit.build?.id ?? "");
    setRoundsFired(String(sessionToEdit.roundsFired));
    setSessionNote(sessionToEdit.notes ?? "");
    setAmmoSelections(
      sessionToEdit.ammoLinks.length > 0
        ? sessionToEdit.ammoLinks.map((link) => ({
            ammoStockId: link.ammoStock.id,
            roundsUsed: String(link.roundsUsed),
          }))
        : [{ ammoStockId: "", roundsUsed: "" }]
    );
  }, [sessions, showLogSession]);

  const drillHitFactorPreview = useMemo(() => {
    const time = selectedDrillTemplate?.mode === "accuracy" ? 1 : Number.parseFloat(drillTime);
    const points = selectedDrillTemplate?.mode === "time" ? 0 : Number.parseFloat(drillPoints);
    const penalties = Number.parseFloat(drillPenalties || "0");
    const adjustedPoints = Number.isFinite(points) ? Math.max(0, points - (Number.isFinite(penalties) ? penalties : 0)) : 0;
    return calculateHitFactor(adjustedPoints, time);
  }, [drillTime, drillPoints, drillPenalties, selectedDrillTemplate]);

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
      { id: safeId("session-drill"), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" },
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
    const isEditingSession = Boolean(editingSessionId);

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
    if (!isEditingSession && hasIncompleteDrillRows) {
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
      const sessionRes = await fetch(isEditingSession ? `/api/range/sessions/${editingSessionId}` : "/api/range/sessions", {
        method: isEditingSession ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate: sessionDate || new Date().toISOString().slice(0, 10),
          location: sessionLocation || "Unspecified location",
          firearmId: selectedFirearmId,
          buildId: selectedBuild || null,
          roundsFired: resolvedRounds,
          notes: sessionNote,
          ...(isEditingSession ? {} : { ammoLinks: normalizedAmmoLinks, sessionDrills: normalizedSessionDrills }),
        }),
      });

      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) {
        throw new Error(sessionJson.error ?? "Failed to create range session");
      }

      setSavedSessionId(sessionJson.id);

      if (!isEditingSession) {
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
        setSessionDrillEntries([{ id: safeId("session-drill"), name: "", timeSeconds: "", points: "", penalties: "", hits: "", notes: "" }]);
      } else {
        await loadSessions();
        setSelectedSessionId(sessionJson.id);
        setSuccess("Session updated.");
        setWarning("V1 edit mode updates session details only. Existing ammo links and drill logs are preserved.");
      }
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
    setError(null);
    setSuccess(null);
    setWarning(null);
    setSubmittingDrill(true);

    try {
      if (!selectedDrillTemplate) {
        throw new Error("Select a drill template from the Drill Library.");
      }

      const parsedTime = Number.parseFloat(drillTime);
      const parsedPoints = Number.parseFloat(drillPoints);
      const resolvedTime = selectedDrillTemplate.mode === "accuracy" ? 1 : parsedTime;
      const resolvedPoints = selectedDrillTemplate.mode === "time" ? 0 : parsedPoints;

      if (!Number.isFinite(resolvedTime) || resolvedTime <= 0) {
        throw new Error("Enter a valid drill time.");
      }

      if (!Number.isFinite(resolvedPoints) || resolvedPoints < 0) {
        throw new Error("Enter a valid points value.");
      }

      const payload = {
        name: drillName,
        setNumber: nextSetNumberForSelectedDrill,
        timeSeconds: resolvedTime,
        points: resolvedPoints,
        penalties: selectedDrillTemplate.mode === "time" ? undefined : (drillPenalties ? Number.parseFloat(drillPenalties) : undefined),
        hits: selectedDrillTemplate.mode === "time" ? undefined : (drillHits ? Number.parseInt(drillHits, 10) : undefined),
        notes: drillNotes,
      };

      const endpoint = selectedSessionId ? `/api/range/sessions/${selectedSessionId}/drills` : `/api/range/drills`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to add drill");
      }

      if (selectedSessionId) {
        const drillsRes = await fetch(`/api/range/sessions/${selectedSessionId}/drills`);
        const drillsJson = await drillsRes.json();
        setSessionDrills(Array.isArray(drillsJson) ? drillsJson : []);
      }
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

  useEffect(() => {
    if (!drillName && drillLibrary.length > 0) {
      setDrillName(drillLibrary[0].name);
    }
  }, [drillLibrary, drillName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const editId = new URLSearchParams(window.location.search).get("edit");
    if (!editId) {
      setEditingDrillId(null);
      return;
    }
    const found = drillLibrary.find((d) => d.id === editId);
    if (!found) return;
    setEditingDrillId(found.id);
    setCustomDrillName(found.name);
    setCustomDrillNotes(found.notes ?? "");
    setCustomDrillMode(found.mode);
  }, [drillLibrary]);

  const selectedPerformanceTemplate = useMemo(
    () => drillLibrary.find((template) => template.name === performanceDrillName) ?? null,
    [drillLibrary, performanceDrillName]
  );

  const performanceRows = useMemo(() => {
    const filtered = performanceDrillName
      ? allLoggedDrills.filter((drill) => drill.name.trim() === performanceDrillName)
      : allLoggedDrills;

    const sorted = [...filtered]
      .sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime())
      .slice(-30);

    return sorted.map((drill, index) => ({
      ...drill,
      index: index + 1,
      displayDate: new Date(drill.sessionDate).toLocaleDateString(),
      scoreValue: Math.max(0, drill.points - (drill.penalties ?? 0)),
    }));
  }, [allLoggedDrills, performanceDrillName]);

  const performanceMetrics = useMemo(() => {
    const mode = selectedPerformanceTemplate?.mode ?? (performanceRows[0] ? inferDrillModeFromEntry(performanceRows[0]) : "both");
    return resolveDrillMetrics(mode);
  }, [selectedPerformanceTemplate, performanceRows]);

  const selectedPerformanceRow = useMemo(
    () => performanceRows.find((row) => row.id === selectedPerformanceDrillId) ?? null,
    [performanceRows, selectedPerformanceDrillId]
  );

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

    if (editingDrillId) {
      setDrillLibrary((prev) =>
        prev.map((item) =>
          item.id === editingDrillId
            ? { ...item, name, notes: customDrillNotes.trim() || null, mode: customDrillMode }
            : item
        )
      );
      setSuccess(`Updated "${name}" drill template.`);
      if (typeof window !== "undefined") {
        router.replace("/range/drill-library");
      }
      setEditingDrillId(null);
    } else {
      setDrillLibrary((prev) => [
        {
          id: safeId("drill-template"),
          name,
          notes: customDrillNotes.trim() || null,
          mode: customDrillMode,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setCustomDrillName("");
    setCustomDrillNotes("");
    setCustomDrillMode("both");
  }

  function handleDeleteDrill(template: DrillTemplate) {
    if (deletingDrillId) return;
    const hasHistory = drillNameLibrary.some((name) => name.trim().toLowerCase() === template.name.trim().toLowerCase());
    if (hasHistory) {
      setError(`Cannot delete "${template.name}" because it has linked logged history.`);
      return;
    }

    if (!window.confirm(`Delete drill template "${template.name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingDrillId(template.id);
    setDrillLibrary((prev) => prev.filter((item) => item.id !== template.id));
    setSuccess(`Deleted "${template.name}" from drill library.`);
    if (drillName === template.name) {
      setDrillName("");
    }
    setDeletingDrillId(null);
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

      <div className="max-w-4xl mx-auto w-full overflow-x-hidden px-4 sm:px-6 py-6 sm:py-8 space-y-6">
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
            {editingSessionId && (
              <p className="text-xs text-vault-text-muted">
                Editing session <span className="font-mono">{editingSessionId.slice(0, 12)}</span>. V1 edit mode updates session details only and preserves existing ammo links/drill logs.
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={vaultLabelClass}>Session Date</label>
                <VaultInput
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  
                />
              </div>

              <div>
                <label className={vaultLabelClass}>Location</label>
                <VaultInput
                  type="text"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  placeholder="e.g. Oak Ridge Sportsmen Club"
                  
                />
              </div>
            </div>

            <div>
              <label className={vaultLabelClass}>Firearm</label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
              ) : (
                <div className="relative">
                  <VaultSelect
                    value={selectedFirearm}
                    onChange={(e) => {
                      setSelectedFirearm(e.target.value);
                      setSelectedBuild("");
                    }}
                    
                  >
                    <option value="">Auto-select first firearm</option>
                    {firearms.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} ({f.caliber})</option>
                    ))}
                  </VaultSelect>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
              )}
            </div>

            {selectedFirearm && (
              <div>
                <label className={vaultLabelClass}>Build</label>
                {loadingBuilds ? (
                  <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
                ) : builds.length === 0 ? (
                  <p className="text-sm text-vault-text-faint py-2">No builds for this firearm.</p>
                ) : (
                  <div className="relative">
                    <VaultSelect value={selectedBuild} onChange={(e) => setSelectedBuild(e.target.value)} >
                      <option value="">No build selected</option>
                      {builds.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}{b.isActive ? " (Active)" : ""}</option>
                      ))}
                    </VaultSelect>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={vaultLabelClass}>Rounds Fired</label>
                <VaultInput
                  type="number"
                  min={0}
                  value={roundsFired}
                  onChange={(e) => setRoundsFired(e.target.value)}
                  placeholder="Optional (auto-sums ammo rows)"
                  
                />
              </div>
            </div>

            {!editingSessionId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className={vaultLabelClass}>Ammo Used (multiple types supported)</label>
                <VaultButton
                  type="button"
                  onClick={addAmmoSelection}
                  className="px-2.5 py-1.5 text-xs"
                >
                  Add Ammo Type
                </VaultButton>
              </div>
              {loadingAmmo ? (
                <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" /></div>
              ) : (
                ammoSelections.map((selection, index) => (
                  <div key={`ammo-selection-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_160px_auto] gap-2">
                    <div className="relative">
                      <VaultSelect
                        value={selection.ammoStockId}
                        onChange={(e) => updateAmmoSelection(index, { ammoStockId: e.target.value })}
                        
                      >
                        <option value="">No ammo selected</option>
                        {compatibleAmmo.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.caliber} · {a.brand}{a.grainWeight ? ` ${a.grainWeight}gr` : ""}{a.bulletType ? ` ${a.bulletType}` : ""} — {formatNumber(a.quantity)} rds
                          </option>
                        ))}
                      </VaultSelect>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                    </div>
                    <VaultInput
                      type="number"
                      min={0}
                      value={selection.roundsUsed}
                      onChange={(e) => updateAmmoSelection(index, { roundsUsed: e.target.value })}
                      placeholder="Rounds"
                      
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
            )}

            {!editingSessionId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className={vaultLabelClass}>Drills Completed During This Session</label>
                <VaultButton
                  type="button"
                  onClick={addSessionDrillEntry}
                  className="px-2.5 py-1.5 text-xs"
                >
                  Add Drill Set
                </VaultButton>
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
                      <label className={vaultLabelClass}>Drill Name</label>
                      <VaultInput
                        value={entry.name}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { name: e.target.value })}
                        
                        placeholder="e.g. Bill Drill"
                      />
                    </div>
                    <div>
                      <label className={vaultLabelClass}>Time (seconds)</label>
                      <VaultInput
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={entry.timeSeconds}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { timeSeconds: e.target.value })}
                        
                        placeholder="2.45"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className={vaultLabelClass}>Points</label>
                      <VaultInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.points}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { points: e.target.value })}
                        
                        placeholder="90"
                      />
                    </div>
                    <div>
                      <label className={vaultLabelClass}>Penalties</label>
                      <VaultInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={entry.penalties}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { penalties: e.target.value })}
                        
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={vaultLabelClass}>Hits</label>
                      <VaultInput
                        type="number"
                        min="0"
                        value={entry.hits}
                        onChange={(e) => updateSessionDrillEntry(entry.id, { hits: e.target.value })}
                        
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
                    <label className={vaultLabelClass}>Set Notes</label>
                    <VaultTextArea
                      rows={2}
                      value={entry.notes}
                      onChange={(e) => updateSessionDrillEntry(entry.id, { notes: e.target.value })}
                      className={`resize-none`}
                    />
                  </div>
                </div>
              ))}
            </div>
            )}

            <div>
              <label className={vaultLabelClass}>Notes</label>
              <VaultTextArea
                rows={3}
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="e.g. Match prep and transition work"
                className={`resize-none`}
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
              {submitting ? (editingSessionId ? "Saving..." : "Logging...") : (editingSessionId ? "Save Session Changes" : "Log Session")}
            </button>
          </div>
        </form>
        )}

        
        {showLogDrill && (
        <fieldset id="log-a-drill" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Log Drill Results</legend>

          <form onSubmit={handleAddDrill} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={vaultLabelClass}>Drill Template <span className="text-[#E53935]">*</span></label>
                <div className="relative">
                  <VaultSelect
                    required
                    value={drillName}
                    onChange={(e) => setDrillName(e.target.value)}
                    
                    disabled={drillLibrary.length === 0}
                  >
                    <option value="">Select drill template...</option>
                    {drillLibrary.map((template) => (
                      <option key={template.id} value={template.name}>
                        {template.name} ({template.mode})
                      </option>
                    ))}
                  </VaultSelect>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
                {selectedSessionId && drillName.trim() && (
                  <p className="mt-1 text-xs text-vault-text-faint">This will be saved as set {nextSetNumberForSelectedDrill} for this drill in the selected session.</p>
                )}
                {selectedDrillTemplate?.notes && (
                  <p className="mt-1 text-xs text-vault-text-faint">{selectedDrillTemplate.notes}</p>
                )}
                <div className="mt-3 relative">
                  <VaultSelect value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} disabled={loadingSessions}>
                    <option value="">No session (optional)</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {new Date(session.sessionDate).toLocaleDateString()} · {session.location} · {session.firearm.name}
                      </option>
                    ))}
                  </VaultSelect>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                </div>
              </div>
              {selectedDrillTemplate?.mode !== "accuracy" && (
              <div>
                <label className={vaultLabelClass}>Time (seconds) <span className="text-[#E53935]">*</span></label>
                <VaultInput type="number" step="0.01" min="0.01" required value={drillTime} onChange={(e) => setDrillTime(e.target.value)}  placeholder="2.45" />
              </div>
              )}
            </div>

            <div id="hit-factor-calculator" className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 scroll-mt-20">
              {selectedDrillTemplate?.mode !== "time" && (
              <div>
                <label className={vaultLabelClass}>Points <span className="text-[#E53935]">*</span></label>
                <VaultInput type="number" step="0.01" min="0" required value={drillPoints} onChange={(e) => setDrillPoints(e.target.value)}  placeholder="90" />
              </div>
              )}
              {selectedDrillTemplate?.mode !== "time" && (
              <div>
                <label className={vaultLabelClass}>Penalties</label>
                <VaultInput type="number" step="0.01" min="0" value={drillPenalties} onChange={(e) => setDrillPenalties(e.target.value)}  placeholder="10" />
              </div>
              )}
              {selectedDrillTemplate?.mode !== "time" && (
              <div>
                <label className={vaultLabelClass}>Hits</label>
                <VaultInput type="number" min="0" value={drillHits} onChange={(e) => setDrillHits(e.target.value)}  placeholder="6" />
              </div>
              )}
              {selectedDrillTemplate?.mode !== "time" && (
              <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2">
                <p className="text-[11px] text-vault-text-faint uppercase tracking-widest">Hit Factor</p>
                <p className="text-lg font-mono text-[#00C2FF]">{drillHitFactorPreview.toFixed(4)}</p>
              </div>
              )}
            </div>

            <div>
              <label className={vaultLabelClass}>Drill Notes</label>
              <VaultTextArea rows={2} value={drillNotes} onChange={(e) => setDrillNotes(e.target.value)} className={`resize-none`} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingDrill}
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
              <label className={vaultLabelClass}>Drill</label>
              <div className="relative">
                <VaultSelect
                  value={performanceDrillName}
                  onChange={(e) => setPerformanceDrillName(e.target.value)}
                  
                  disabled={drillNameLibrary.length === 0}
                >
                  {drillNameLibrary.length === 0 ? (
                    <option value="">No drills available</option>
                  ) : (
                    drillNameLibrary.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </VaultSelect>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
              </div>
            </div>
<div className="rounded border border-vault-border bg-vault-bg px-3 py-2">
              <p className="text-xs text-vault-text-faint">Metrics</p>
              <p className="text-sm text-vault-text">{performanceMetrics.map((m) => m.label).join(" + ")}</p>
            </div>
          </div>

          {performanceRows.length === 0 ? (
            <p className="text-sm text-vault-text-faint">No historical data for the selected drill yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="h-64 w-full rounded-md border border-vault-border bg-vault-bg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceRows} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                    <XAxis dataKey="displayDate" tick={{ fill: "#9CA3AF", fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} width={52} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#101114", border: "1px solid #2C2F36", borderRadius: 8 }}
                      labelStyle={{ color: "#E5E7EB" }}
                      formatter={(value, name) => {
                        const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                        const metric = performanceMetrics.find((m) => m.key === name) ?? null;
                        const formatted = metric?.key === "hitFactor" ? numericValue.toFixed(4) : numericValue.toFixed(2);
                        return [metric?.unit ? `${formatted}${metric.unit}` : formatted, metric?.label ?? name];
                      }}
                    />
                    <YAxis yAxisId="left" tick={{ fill: "#9CA3AF", fontSize: 11 }} width={52} />
                    {performanceMetrics.some((m) => m.yAxisId === "right") && (
                      <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9CA3AF", fontSize: 11 }} width={52} />
                    )}
                    {performanceMetrics.map((metric) => (
                      <Line
                        key={metric.key}
                        yAxisId={metric.yAxisId ?? "left"}
                        type="monotone"
                        dataKey={metric.key === "time" ? "timeSeconds" : metric.key === "score" ? "scoreValue" : "hitFactor"}
                        name={metric.key}
                        stroke={metric.color}
                        strokeWidth={2}
                        dot={(props: { cx?: number; cy?: number; payload?: { id?: string; sessionId?: string } }) => (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={4}
                            fill={metric.color}
                            stroke={metric.color}
                            strokeWidth={1}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              const pointId = props.payload?.id;
                              const sessionId = props.payload?.sessionId;
                              if (pointId) setSelectedPerformanceDrillId(pointId);
                              if (sessionId) setSelectedSessionId(sessionId);
                            }}
                          />
                        )}
                        activeDot={{ r: 6, stroke: metric.color, fill: "#101114" }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-vault-text-faint">
                Tap a point to open that specific drill result context.
              </p>

              {selectedPerformanceRow && (
                <div className="bg-vault-bg border border-[#00C2FF]/30 rounded-md p-3">
                  <p className="text-sm font-medium text-vault-text">{selectedPerformanceRow.name} · Set {selectedPerformanceRow.setNumber}</p>
                  <p className="text-xs text-vault-text-faint mt-1">
                    {selectedPerformanceRow.displayDate} · {selectedPerformanceRow.location} · {selectedPerformanceRow.points} pts in {selectedPerformanceRow.timeSeconds}s
                  </p>
                  <div className="mt-2">
                    <Link
                      href={`/range/log-drill?sessionId=${selectedPerformanceRow.sessionId}#logged-drills`}
                      className="text-xs text-[#00C2FF] hover:underline"
                    >
                      Open this drill entry
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </fieldset>
        )}

        {showDrillLibrary && (
        <fieldset id="drill-library" className={`${SECTION_CARD_CLASS} scroll-mt-20`}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Drill Library</legend>
          <div className="space-y-4">
            <div className="rounded-lg border border-vault-border bg-vault-bg p-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-vault-text-muted">Create New Drill</p>
              <p className="text-xs text-vault-text-faint">Choose a name and how the drill is scored so logging screens show the right performance fields.</p>
              <form onSubmit={addCustomDrill} className="grid gap-3 md:grid-cols-[1fr_1fr_180px_auto] items-end">
                <div>
                  <label className={vaultLabelClass}>Basic Info · Drill Name</label>
                  <VaultInput
                    value={customDrillName}
                    onChange={(e) => setCustomDrillName(e.target.value)}
                    placeholder="e.g. El Prez"
                  />
                </div>
                <div>
                  <label className={vaultLabelClass}>Notes / Configuration</label>
                  <VaultInput
                    value={customDrillNotes}
                    onChange={(e) => setCustomDrillNotes(e.target.value)}
                    placeholder="Optional setup notes"
                  />
                </div>
                <div>
                  <label className={vaultLabelClass}>Performance Tracking</label>
                  <VaultSelect value={customDrillMode} onChange={(e) => setCustomDrillMode(e.target.value as DrillPerformanceMode)} >
                    <option value="both">Time + Accuracy</option>
                    <option value="time">Time only</option>
                    <option value="accuracy">Accuracy only</option>
                  </VaultSelect>
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-md text-sm bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20"
                >
                  <span className="inline-flex items-center gap-2"><BookPlus className="w-4 h-4" />{editingDrillId ? "Save Drill" : "Add Drill"}</span>
                </button>
              </form>
            </div>
          </div>

          {!drillLibNoticeDismissed && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 text-xs text-amber-200 mb-4">
              <span className="shrink-0 mt-0.5">ℹ</span>
              <div className="flex-1">
                Drill templates are saved to this browser only.
                They won&#39;t appear on your phone or other devices.
              </div>
              <button
                onClick={() => {
                  localStorage.setItem("bv-drill-lib-notice-dismissed", "1");
                  setDrillLibNoticeDismissed(true);
                }}
                className="shrink-0 text-amber-400 hover:text-amber-200"
              >×</button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-vault-text-muted">Template Library</p>
            {drillLibrary.length === 0 ? (
              <p className="text-sm text-vault-text-faint">No drill templates yet.</p>
            ) : (
              <div className="space-y-2">
                {drillLibrary.map((template) => (
                  <div
                    key={template.id}
                    className="w-full text-left bg-vault-bg border border-vault-border hover:border-[#00C2FF]/40 transition-colors rounded-md px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-vault-text font-medium">{template.name}</p>
                          {(() => {
                            const modeUpper = template.mode.toUpperCase();
                            const modeClass = modeUpper === "TIME"
                              ? "bg-blue-900/50 text-blue-300 border border-blue-700/50"
                              : modeUpper === "ACCURACY"
                              ? "bg-green-900/50 text-green-300 border border-green-700/50"
                              : "bg-purple-900/50 text-purple-300 border border-purple-700/50";
                            return (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${modeClass}`}>
                                {modeUpper}
                              </span>
                            );
                          })()}
                        </div>
                        {template.notes && <p className="text-xs text-vault-text-muted mt-1 line-clamp-1">{template.notes}</p>}
                        <span className="text-[10px] text-vault-text-faint">
                          {sessionCountByDrill[template.name] ?? 0} sessions logged
                        </span>
                      </div>
                    </div>
                    <hr className="border-vault-border/40 my-2" />
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDrillName(template.name);
                          router.push(`/range/log-drill?drill=${encodeURIComponent(template.name)}`);
                        }}
                        className="text-xs px-2 py-1 rounded border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors"
                      >
                        Select
                      </button>
                      <Link href={`/range/drill-library?edit=${template.id}`} className="text-xs px-2 py-1 rounded border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors">Edit</Link>
                      <Link href={`/range/drill-performance?drill=${encodeURIComponent(template.name)}`} className="text-xs px-2 py-1 rounded border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors">History</Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteDrill(template)}
                        disabled={deletingDrillId === template.id}
                        className="text-xs px-2 py-1 rounded border border-[#E53935]/40 text-[#E53935] disabled:opacity-60 hover:bg-[#E53935]/10 transition-colors"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Trash2 className="h-3 w-3" />
                          {deletingDrillId === template.id ? "Deleting..." : "Delete"}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 w-full sm:w-auto sm:min-w-[320px]">
                <VaultInput
                  type="number"
                  min="0"
                  step="0.1"
                  value={bulletWeight}
                  onChange={(e) => setBulletWeight(e.target.value)}
                  placeholder="gr"
                  
                />
                <VaultInput
                  type="number"
                  min="0"
                  step="1"
                  value={muzzleVelocity}
                  onChange={(e) => setMuzzleVelocity(e.target.value)}
                  placeholder="fps"
                  
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
                <label className={vaultLabelClass}>Extra Points</label>
                <VaultInput type="number" step="0.01" min="0" value={calculatorPoints} onChange={(e) => setCalculatorPoints(e.target.value)}  placeholder="0" />
              </div>
              <div>
                <label className={vaultLabelClass}>Other Penalties</label>
                <VaultInput type="number" step="0.01" min="0" value={calculatorPenalties} onChange={(e) => setCalculatorPenalties(e.target.value)}  placeholder="0" />
              </div>
              <div>
                <label className={vaultLabelClass}>Time (sec)</label>
                <VaultInput type="number" step="0.01" min="0.01" value={calculatorTime} onChange={(e) => setCalculatorTime(e.target.value)}  placeholder="2.45" />
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
                <div
                  key={session.id}
                  className={`w-full text-left rounded-md border transition-colors ${
                    session.id === selectedSessionId ? "border-[#00C2FF]/50 bg-[#00C2FF]/10" : "border-vault-border bg-vault-bg hover:border-vault-text-muted/30"
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-vault-text">{new Date(session.sessionDate).toLocaleDateString()} · {session.location}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-[#F5A623]">{formatNumber(session.roundsFired)} rds</p>
                        <button
                          type="button"
                          onClick={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                          className="text-[11px] px-2 py-1 rounded border border-vault-border text-vault-text-muted inline-flex items-center gap-1"
                        >
                          {expandedSessionId === session.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          View
                        </button>
                        <Link
                          href={`/range/log-session?edit=${session.id}`}
                          className="text-[11px] px-2 py-1 rounded border border-[#00C2FF]/30 text-[#00C2FF] inline-flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </Link>
                        {deleteConfirmId === session.id ? (
                          <span className="flex items-center gap-1">
                            <span className="text-xs text-vault-text-muted">Delete?</span>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={!!deletingSessionId}
                              className="text-xs text-red-400 hover:text-red-300"
                            >Yes</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-vault-text-muted hover:text-vault-text">Cancel</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setDeleteConfirmId(session.id);
                              setDeleteErrorId(null);
                            }}
                            className="p-1.5 text-vault-text-faint hover:text-red-400 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {deleteErrorId === session.id && (
                          <span className="text-xs text-red-400">Failed to delete. Try again.</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-vault-text-muted mt-1">
                      {session.firearm.name}{session.build ? ` · ${session.build.name}` : ""} · {session.ammoLinks.map((link) => `${link.ammoStock.brand} (${link.roundsUsed})`).join(", ")}
                    </p>
                  </div>
                  {expandedSessionId === session.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-vault-border/40 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-vault-text-muted">
                        <span>Date: {new Date(session.sessionDate).toLocaleDateString()}</span>
                        <span>Location: {session.location}</span>
                        <span>Firearm: {session.firearm.name}</span>
                        <span>Rounds: {session.roundsFired}</span>
                      </div>
                      {session.sessionDrills && session.sessionDrills.length > 0 ? (
                        <table className="w-full text-xs mt-2">
                          <thead>
                            <tr className="text-vault-text-faint border-b border-vault-border">
                              <th className="text-left py-1">Drill</th>
                              <th className="text-left py-1">Set</th>
                              <th className="text-right py-1">Time</th>
                              <th className="text-right py-1">HF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {session.sessionDrills.map((drill) => (
                              <tr key={drill.id} className="border-b border-vault-border/40">
                                <td className="py-1">{drill.name}</td>
                                <td className="py-1">{drill.setNumber}</td>
                                <td className="py-1 text-right">{drill.timeSeconds}s</td>
                                <td className="py-1 text-right font-mono text-[#00C2FF]">{drill.hitFactor.toFixed(4)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-xs text-vault-text-faint">No drills logged for this session</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {selectedSession?.sessionDrills?.length ? (
            <p className="text-xs text-vault-text-faint">Selected session has {selectedSession.sessionDrills.length} drill set{selectedSession.sessionDrills.length === 1 ? "" : "s"} logged.</p>
          ) : null}
          {selectedSession ? (
            <div className="pt-1">
              <Link
                href={`/range/log-session?edit=${selectedSession.id}`}
                className="text-xs text-[#00C2FF] hover:underline inline-flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                Edit selected session
              </Link>
            </div>
          ) : null}
        </fieldset>
        )}
      </div>
    </div>
  );
}
