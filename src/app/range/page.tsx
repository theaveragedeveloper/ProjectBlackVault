"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import { Target, ChevronDown, Loader2, AlertCircle, CheckCircle2, Shield, Timer } from "lucide-react";

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

interface SessionDrill {
  id: string;
  name: string;
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

const ROUND_COUNT_SLOTS = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "TRIGGER", "SLIDE", "FRAME"]);

function calculateHitFactor(points: number, timeSeconds: number) {
  if (!Number.isFinite(timeSeconds) || timeSeconds <= 0) return 0;
  if (!Number.isFinite(points) || points < 0) return 0;
  return Number((points / timeSeconds).toFixed(4));
}

export default function RangeSessionPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoStocks, setAmmoStocks] = useState<AmmoStock[]>([]);
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [sessionDrills, setSessionDrills] = useState<SessionDrill[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState<string>("");
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [roundsFired, setRoundsFired] = useState<string>("");
  const [selectedAmmoStock, setSelectedAmmoStock] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionLocation, setSessionLocation] = useState<string>("");
  const [sessionNote, setSessionNote] = useState<string>("");
  const [selectedAccessories, setSelectedAccessories] = useState<Set<string>>(new Set());

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [drillName, setDrillName] = useState<string>("");
  const [drillTime, setDrillTime] = useState<string>("");
  const [drillPoints, setDrillPoints] = useState<string>("");
  const [drillPenalties, setDrillPenalties] = useState<string>("");
  const [drillHits, setDrillHits] = useState<string>("");
  const [drillNotes, setDrillNotes] = useState<string>("");

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
      if (slot.accessory && ROUND_COUNT_SLOTS.has(slot.slotType)) {
        autoSelect.add(slot.accessory.id);
      }
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

  const selectedFirearmData = firearms.find((f) => f.id === selectedFirearm);
  const selectedBuildData = builds.find((b) => b.id === selectedBuild);
  const buildAccessories = selectedBuildData?.slots.filter((s) => s.accessory) ?? [];

  const compatibleAmmo = selectedFirearmData
    ? ammoStocks.filter((a) => a.caliber === selectedFirearmData.caliber)
    : ammoStocks;

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null;
  const isSessionReadyToLog = Boolean(selectedFirearm && roundsFired && selectedAmmoStock && sessionDate && sessionLocation);

  const drillHitFactorPreview = useMemo(() => {
    const time = Number.parseFloat(drillTime);
    const points = Number.parseFloat(drillPoints);
    const penalties = Number.parseFloat(drillPenalties || "0");
    const adjustedPoints = Number.isFinite(points) ? Math.max(0, points - (Number.isFinite(penalties) ? penalties : 0)) : 0;
    return calculateHitFactor(adjustedPoints, time);
  }, [drillTime, drillPoints, drillPenalties]);

  function toggleAccessory(accessoryId: string) {
    setSelectedAccessories((prev) => {
      const next = new Set(prev);
      if (next.has(accessoryId)) next.delete(accessoryId);
      else next.add(accessoryId);
      return next;
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

    const rounds = Number.parseInt(roundsFired, 10);
    if (!rounds || rounds <= 0) {
      setError("Please enter a valid number of rounds fired.");
      setSubmitting(false);
      return;
    }

    if (!sessionDate || !sessionLocation.trim()) {
      setError("Session date and location are required.");
      setSubmitting(false);
      return;
    }

    if (!selectedAmmoStock) {
      setError("Please select ammo for this session.");
      setSubmitting(false);
      return;
    }

    const selectedAmmoData = ammoStocks.find((stock) => stock.id === selectedAmmoStock);
    if (!selectedAmmoData) {
      setError("Selected ammo stock is invalid.");
      setSubmitting(false);
      return;
    }

    if (selectedAmmoData.quantity < rounds) {
      setError(`Insufficient ammo in selected stock. Available: ${formatNumber(selectedAmmoData.quantity)} rounds.`);
      setSubmitting(false);
      return;
    }

    try {
      const sessionRes = await fetch("/api/range/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionDate,
          location: sessionLocation,
          firearmId: selectedFirearm,
          buildId: selectedBuild || null,
          roundsFired: rounds,
          notes: sessionNote,
          ammoLinks: [{ ammoStockId: selectedAmmoStock, roundsUsed: rounds }],
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
          selectedAccessoryIds: Array.from(selectedAccessories),
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
      setSelectedAmmoStock("");
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

      setDrillName("");
      setDrillTime("");
      setDrillPoints("");
      setDrillPenalties("");
      setDrillHits("");
      setDrillNotes("");
      setSuccess("Drill logged successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Drill log failed");
    } finally {
      setSubmittingDrill(false);
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="RANGE SESSION"
        subtitle="Log rounds, persist sessions, and track drill performance history"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="bg-vault-surface border border-vault-border rounded-lg px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-widest text-vault-text-faint">1) Setup</p>
            <p className="text-sm text-vault-text-muted mt-1">Choose firearm, build, and ammo.</p>
          </div>
          <div className="bg-vault-surface border border-vault-border rounded-lg px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-widest text-vault-text-faint">2) Log session</p>
            <p className="text-sm text-vault-text-muted mt-1">Save date, location, and rounds fired.</p>
          </div>
          <div className="bg-vault-surface border border-vault-border rounded-lg px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-widest text-vault-text-faint">3) Add drills</p>
            <p className="text-sm text-vault-text-muted mt-1">Record drill metrics to compare sessions.</p>
          </div>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className={SECTION_CARD_CLASS}>
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Session Details</legend>
            <p className="text-xs text-vault-text-faint -mt-1">Required fields are marked with <span className="text-[#E53935]">*</span>.</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Session Date <span className="text-[#E53935]">*</span></label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Location <span className="text-[#E53935]">*</span></label>
                <input
                  type="text"
                  required
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  placeholder="e.g. Oak Ridge Sportsmen Club"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Firearm <span className="text-[#E53935]">*</span></label>
              {loadingFirearms ? (
                <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#00C2FF] animate-spin" /></div>
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
                <label className={LABEL_CLASS}>Rounds Fired <span className="text-[#E53935]">*</span></label>
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
                <label className={LABEL_CLASS}>Ammo Stock <span className="text-[#E53935]">*</span></label>
                {loadingAmmo ? (
                  <div className="flex items-center gap-2 h-10"><Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" /></div>
                ) : (
                  <div className="relative">
                    <select required value={selectedAmmoStock} onChange={(e) => setSelectedAmmoStock(e.target.value)} className={INPUT_CLASS}>
                      <option value="">Select ammo...</option>
                      {compatibleAmmo.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.caliber} · {a.brand}{a.grainWeight ? ` ${a.grainWeight}gr` : ""}{a.bulletType ? ` ${a.bulletType}` : ""} — {formatNumber(a.quantity)} rds
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
                  </div>
                )}
                <p className="text-xs text-vault-text-faint mt-1">Selected ammo must match firearm caliber and have enough quantity for rounds fired.</p>
              </div>
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
              <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Attribute Rounds To Accessories</legend>
              <div className="space-y-2">
                {buildAccessories.map((slot) => {
                  if (!slot.accessory) return null;
                  const isSelected = selectedAccessories.has(slot.accessory.id);
                  const isRoundCountPart = ROUND_COUNT_SLOTS.has(slot.slotType);

                  return (
                    <label key={slot.id} className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                      isSelected ? "bg-[#00C2FF]/10 border-[#00C2FF]/30" : "bg-vault-bg border-vault-border hover:border-vault-text-muted/30"
                    }`}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleAccessory(slot.accessory!.id)} className="sr-only" />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-[#00C2FF] border-[#00C2FF]" : "border-vault-border"}`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-vault-bg" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-vault-text truncate">{slot.accessory.name}</p>
                          {isRoundCountPart && <span className="text-[10px] text-[#F5A623] border border-[#F5A623]/30 px-1.5 py-0.5 rounded font-mono">wear part</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-vault-text-faint">
                          <span>{SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}</span>
                          <span>·</span>
                          <span className="font-mono text-vault-text-muted">{formatNumber(slot.accessory.roundCount)} rds total</span>
                        </div>
                      </div>
                    </label>
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
            {!isSessionReadyToLog && (
              <p className="text-xs text-vault-text-faint sm:mr-auto">Complete required fields to enable session logging.</p>
            )}
            <button
              type="submit"
              disabled={submitting || !isSessionReadyToLog}
              className="w-full sm:w-auto justify-center flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              {submitting ? "Logging..." : "Log Session"}
            </button>
          </div>
        </form>

        <fieldset className={SECTION_CARD_CLASS}>
          <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">Drills</legend>

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

          <form onSubmit={handleAddDrill} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Drill Name <span className="text-[#E53935]">*</span></label>
                <input required value={drillName} onChange={(e) => setDrillName(e.target.value)} className={INPUT_CLASS} placeholder="e.g. Bill Drill" />
              </div>
              <div>
                <label className={LABEL_CLASS}>Time (seconds) <span className="text-[#E53935]">*</span></label>
                <input type="number" step="0.01" min="0.01" required value={drillTime} onChange={(e) => setDrillTime(e.target.value)} className={INPUT_CLASS} placeholder="2.45" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
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

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-vault-text-muted">Drill History</p>
            {loadingDrills ? (
              <div className="flex items-center gap-2 text-sm text-vault-text-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading drills...</div>
            ) : sessionDrills.length === 0 ? (
              <p className="text-sm text-vault-text-faint">No drills logged yet for this session. Add your first drill above.</p>
            ) : (
              <div className="space-y-2">
                {sessionDrills.map((drill) => (
                  <div key={drill.id} className="bg-vault-bg border border-vault-border rounded-md p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-vault-text">{drill.name}</p>
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
        </fieldset>

        <fieldset className={SECTION_CARD_CLASS}>
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
                </button>
              ))}
            </div>
          )}

          {selectedSession?.sessionDrills?.length ? (
            <p className="text-xs text-vault-text-faint">Session has {selectedSession.sessionDrills.length} drill entr{selectedSession.sessionDrills.length === 1 ? "y" : "ies"}.</p>
          ) : null}
        </fieldset>
      </div>
    </div>
  );
}
