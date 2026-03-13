"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  applyDopeCorrections,
  convertDropWindToAngular,
  generateDistanceRows,
  type AngularDopeRow,
  type BallisticOutputRow,
  type DopeRowCorrection,
  type WindDirectionUnit,
  type WindZoneInput,
} from "@/lib/ballistics/dope";
import { solveTrajectoryRows, type DragModel } from "@/lib/ballistics/solver";
import { trueBallisticProfile, type TruingParameter } from "@/lib/ballistics/truing";
import { Calculator, Download, Target, Upload } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";
const STORAGE_KEY = "pbv-dope-card-profiles-v1";

interface SavedProfile {
  name: string;
  payload: {
    startYd: string;
    endYd: string;
    stepYd: string;
    muzzleVelocityFps: string;
    ballisticCoefficient: string;
    dragModel: DragModel;
    zeroRangeYd: string;
    sightHeightIn: string;
    twistIn: string;
    temperatureF: string;
    pressureInHg: string;
    densityAltitudeFt: string;
    humidityPercent: string;
    windSpeedMph: string;
    windAngleDeg: string;
    baseRows: AngularDopeRow[];
    corrections: Record<number, DopeRowCorrection>;
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createZone(startYd: number, endYd: number | null): WindZoneInput {
  return { startYd, endYd, speedMph: 0, directionValue: 90, directionUnit: "degrees" };
}

function formatDirection(value: number, unit: WindDirectionUnit): string {
  return unit === "clock" ? `${value} o'clock` : `${value}°`;
}

export function validateGeneratorInputs(values: {
  startYd: string;
  endYd: string;
  stepYd: string;
  muzzleVelocityFps: string;
  ballisticCoefficient: string;
  zeroRangeYd: string;
  sightHeightIn: string;
}): string[] {
  const errors: string[] = [];
  const start = Number(values.startYd);
  const end = Number(values.endYd);
  const step = Number(values.stepYd);
  const mv = Number(values.muzzleVelocityFps);
  const bc = Number(values.ballisticCoefficient);
  const zero = Number(values.zeroRangeYd);
  const sh = Number(values.sightHeightIn);

  if (!(start > 0)) errors.push("Start distance must be greater than 0.");
  if (!(end > 0)) errors.push("End distance must be greater than 0.");
  if (!(step > 0)) errors.push("Step distance must be greater than 0.");
  if (Number.isFinite(start) && Number.isFinite(end) && end < start)
    errors.push("End distance must be greater than or equal to start distance.");
  if (!(mv > 0)) errors.push("Muzzle velocity must be greater than 0.");
  if (!(bc > 0)) errors.push("Ballistic coefficient must be greater than 0.");
  if (!(zero > 0)) errors.push("Zero range must be greater than 0.");
  if (!(sh > 0)) errors.push("Sight height must be greater than 0.");

  return errors;
}

export default function DopeCardPage() {
  // --- Solver inputs ---
  const [startYd, setStartYd] = useState("100");
  const [endYd, setEndYd] = useState("800");
  const [stepYd, setStepYd] = useState("100");
  const [muzzleVelocityFps, setMuzzleVelocityFps] = useState("2650");
  const [ballisticCoefficient, setBallisticCoefficient] = useState("0.275");
  const [dragModel, setDragModel] = useState<DragModel>("G7");
  const [zeroRangeYd, setZeroRangeYd] = useState("100");
  const [sightHeightIn, setSightHeightIn] = useState("1.9");
  const [twistIn, setTwistIn] = useState("8");
  const [temperatureF, setTemperatureF] = useState("59");
  const [pressureInHg, setPressureInHg] = useState("29.92");
  const [densityAltitudeFt, setDensityAltitudeFt] = useState("");
  const [humidityPercent, setHumidityPercent] = useState("45");
  const [windSpeedMph, setWindSpeedMph] = useState("10");
  const [windAngleDeg, setWindAngleDeg] = useState("90");

  // --- Wind zones (branch 6) ---
  const [defaultWindDirectionUnit, setDefaultWindDirectionUnit] = useState<WindDirectionUnit>("degrees");
  const [useZones, setUseZones] = useState(false);
  const [zones, setZones] = useState<WindZoneInput[]>([
    createZone(0, 300),
    createZone(300, 700),
    createZone(700, null),
  ]);

  // --- Reactive data flow (branch 5): base rows + corrections → derived rows ---
  const [baseRows, setBaseRows] = useState<AngularDopeRow[]>([]);
  const [corrections, setCorrections] = useState<Record<number, DopeRowCorrection>>({});
  const rows = useMemo(
    () => applyDopeCorrections(baseRows, corrections),
    [baseRows, corrections]
  );

  // --- Truing (branch 3) ---
  const [untunedRows, setUntunedRows] = useState<AngularDopeRow[]>([]);
  const [truingParameter, setTruingParameter] = useState<TruingParameter>("mv");
  const [truingDistanceYd, setTruingDistanceYd] = useState("");
  const [observedElevationMil, setObservedElevationMil] = useState("");
  const [truedMv, setTruedMv] = useState<number | null>(null);
  const [truedBc, setTruedBc] = useState<number | null>(null);

  // --- Profiles (branch 2) ---
  const [profileName, setProfileName] = useState("");
  const [profiles, setProfiles] = useState<SavedProfile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedProfile, setSelectedProfile] = useState("");
  const importRef = useRef<HTMLInputElement | null>(null);

  // --- Validation (branch 1) ---
  const validationErrors = useMemo(
    () =>
      validateGeneratorInputs({
        startYd, endYd, stepYd,
        muzzleVelocityFps, ballisticCoefficient, zeroRangeYd, sightHeightIn,
      }),
    [startYd, endYd, stepYd, muzzleVelocityFps, ballisticCoefficient, zeroRangeYd, sightHeightIn]
  );


  const estimationModel = "Physics-based nonlinear stepper";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  const estimateSummary = useMemo(() => {
    if (!rows.length) return null;
    const confirmedCount = rows.filter((r) => r.confirmed).length;
    return `${confirmedCount}/${rows.length} rows confirmed from impacts`;
  }, [rows]);

  const windAssumptionSummary = useMemo(() => {
    const defaultSummary = `${windSpeedMph || 0} mph @ ${formatDirection(Number(windAngleDeg) || 0, defaultWindDirectionUnit)}`;
    if (!useZones) return `Single wind: ${defaultSummary}`;
    const zoneSummary = zones
      .map((zone) => {
        const endLabel = zone.endYd == null ? "+" : `-${zone.endYd}`;
        return `${zone.startYd}${endLabel} yd: ${zone.speedMph} mph @ ${formatDirection(zone.directionValue, zone.directionUnit)}`;
      })
      .join(" • ");
    return `Zone winds: ${zoneSummary}`;
  }, [defaultWindDirectionUnit, windAngleDeg, windSpeedMph, useZones, zones]);

  const confirmedRows = rows.filter((row) => row.confirmed);
  const isTrued = truedMv !== null || truedBc !== null;

  function updateZone(index: number, patch: Partial<WindZoneInput>) {
    setZones((prev) => prev.map((zone, i) => (i === index ? { ...zone, ...patch } : zone)));
  }

  function handleGenerate() {
    if (validationErrors.length > 0) return;

    const distanceRows = generateDistanceRows(Number(startYd), Number(endYd), Number(stepYd));
    if (distanceRows.length === 0) return;


    const solvedRows = solveTrajectoryRows(distanceRows, {
      muzzleVelocityFps: Number(muzzleVelocityFps),
      ballisticCoefficient: Number(ballisticCoefficient),
      dragModel,
      zeroRangeYd: Number(zeroRangeYd),
      sightHeightIn: Number(sightHeightIn),
      twistIn: Number(twistIn),
      temperatureF: Number(temperatureF),
      pressureInHg: Number(pressureInHg),
      densityAltitudeFt: densityAltitudeFt ? Number(densityAltitudeFt) : undefined,
      humidityPercent: Number(humidityPercent),
      windSpeedMph: Number(windSpeedMph),
      windAngleDeg: Number(windAngleDeg),
    });

    const converted = convertDropWindToAngular(solvedRows);
    setCorrections({});
    setUntunedRows(converted);
    setBaseRows(converted);
    setTruedMv(null);
    setTruedBc(null);
  }

  function updateCorrection(distanceYd: number, patch: DopeRowCorrection) {
    const existing = corrections[distanceYd] ?? {};
    const merged: DopeRowCorrection = { ...existing, ...patch };

    if (patch.dropIn === undefined) delete merged.dropIn;
    if (patch.windIn === undefined) delete merged.windIn;

    const hasAnyCorrection =
      merged.dropIn !== undefined || merged.windIn !== undefined || merged.confirmed !== undefined;
    const nextCorrections = { ...corrections, ...(hasAnyCorrection ? { [distanceYd]: merged } : {}) };
    if (!hasAnyCorrection) delete nextCorrections[distanceYd];

    setCorrections(nextCorrections);
  }

  function handleTrueProfile() {
    const baselineMv = Number(muzzleVelocityFps);
    const baselineBc = Number(ballisticCoefficient);
    const targetDistanceYd = Number(truingDistanceYd);
    const observedMil = Number(observedElevationMil);

    const baseSourceRows: BallisticOutputRow[] = untunedRows.map((row) => ({
      distanceYd: row.distanceYd,
      dropIn: row.dropIn,
      windIn: row.windIn,
    }));

    const trued = trueBallisticProfile({
      rows: baseSourceRows,
      baselineMv,
      baselineBc,
      targetDistanceYd,
      observedElevationMil: observedMil,
      adjust: truingParameter,
    });

    if (!trued) return;

    const angularTruedRows = convertDropWindToAngular(trued.rows);
    setBaseRows(angularTruedRows);
    setTruedMv(trued.truedMv);
    setTruedBc(trued.truedBc);
  }

  function resetTruing() {
    setTruedMv(null);
    setTruedBc(null);
    setBaseRows(untunedRows);
  }

  function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    const payload = {
      startYd, endYd, stepYd,
      muzzleVelocityFps, ballisticCoefficient, dragModel,
      zeroRangeYd, sightHeightIn, twistIn, temperatureF, pressureInHg,
      densityAltitudeFt, humidityPercent, windSpeedMph, windAngleDeg,
      baseRows, corrections,
    };
    setProfiles((current) => [...current.filter((p) => p.name !== name), { name, payload }]);
    setSelectedProfile(name);
  }

  function loadProfile() {
    const profile = profiles.find((p) => p.name === selectedProfile);
    if (!profile) return;
    const p = profile.payload;
    setStartYd(p.startYd); setEndYd(p.endYd); setStepYd(p.stepYd);
    setMuzzleVelocityFps(p.muzzleVelocityFps);
    setBallisticCoefficient(p.ballisticCoefficient);
    setDragModel(p.dragModel);
    setZeroRangeYd(p.zeroRangeYd); setSightHeightIn(p.sightHeightIn);
    setTwistIn(p.twistIn); setTemperatureF(p.temperatureF);
    setPressureInHg(p.pressureInHg); setDensityAltitudeFt(p.densityAltitudeFt);
    setHumidityPercent(p.humidityPercent);
    setWindSpeedMph(p.windSpeedMph); setWindAngleDeg(p.windAngleDeg);
    setBaseRows(p.baseRows); setCorrections(p.corrections);
    setProfileName(profile.name);
  }

  function handleExport() {
    if (!rows.length) return;
    const lines = [
      "DOPE CARD EXPORT",
      `Wind assumptions: ${windAssumptionSummary}`,
      "distance_yd,drop_in,drop_mil,drop_moa,wind_in,wind_mil,wind_moa,confirmed",
      ...rows.map((row) =>
        [row.distanceYd, row.dropIn, row.dropMil, row.dropMoa, row.windIn, row.windMil, row.windMoa, row.confirmed ? "yes" : "no"].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dope-card.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file?: File) {
    if (!file) return;
    file.text().then((text) => {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.baseRows)) setBaseRows(parsed.baseRows);
        if (parsed.corrections) setCorrections(parsed.corrections);
        if (parsed.startYd) setStartYd(parsed.startYd);
        if (parsed.endYd) setEndYd(parsed.endYd);
      } else {
        const lines = text.trim().split("\n").filter((l) => !l.startsWith("DOPE") && !l.startsWith("Wind") && !l.startsWith("distance_yd"));
        const importedRows: AngularDopeRow[] = lines.map((line) => {
          const [distanceYd, dropIn, dropMil, dropMoa, windIn, windMil, windMoa, confirmed] = line.split(",");
          return {
            distanceYd: Number(distanceYd), dropIn: Number(dropIn),
            dropMil: Number(dropMil), dropMoa: Number(dropMoa),
            windIn: Number(windIn), windMil: Number(windMil), windMoa: Number(windMoa),
            confirmed: confirmed?.trim() === "yes" || confirmed?.trim() === "true",
          };
        });
        setBaseRows(importedRows);
      }
    });
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="DOPE CARD BUILDER"
        subtitle="Generate an estimated card, then overwrite each row from confirmed impacts"
      />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Warning banner */}
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg p-4 space-y-1">
          <p className="text-sm text-[#F5A623] font-medium">
            Estimate only: this builder is a starting point and is not a replacement for verified firing data.
          </p>
          <p className="text-xs text-vault-text-muted">Estimation model: {estimationModel}</p>
        </div>

        {/* Solver inputs */}
        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-xs uppercase tracking-widest text-[#00C2FF] font-mono">Auto-Populate Estimates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className={LABEL_CLASS}>Start (yd)</label>
              <input value={startYd} onChange={(e) => setStartYd(e.target.value)} type="number" min={1} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>End (yd)</label>
              <input value={endYd} onChange={(e) => setEndYd(e.target.value)} type="number" min={1} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Step (yd)</label>
              <input value={stepYd} onChange={(e) => setStepYd(e.target.value)} type="number" min={1} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Drag Model</label>
              <select value={dragModel} onChange={(e) => setDragModel(e.target.value as DragModel)} className={INPUT_CLASS}>
                <option value="G1">G1</option>
                <option value="G7">G7</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Muzzle Velocity (fps)</label>
              <input value={muzzleVelocityFps} onChange={(e) => setMuzzleVelocityFps(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>BC</label>
              <input value={ballisticCoefficient} onChange={(e) => setBallisticCoefficient(e.target.value)} type="number" step="0.001" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Zero Range (yd)</label>
              <input value={zeroRangeYd} onChange={(e) => setZeroRangeYd(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Sight Height (in)</label>
              <input value={sightHeightIn} onChange={(e) => setSightHeightIn(e.target.value)} type="number" step="0.1" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Twist (in/rev)</label>
              <input value={twistIn} onChange={(e) => setTwistIn(e.target.value)} type="number" step="0.1" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Temp (°F)</label>
              <input value={temperatureF} onChange={(e) => setTemperatureF(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Pressure (inHg)</label>
              <input value={pressureInHg} onChange={(e) => setPressureInHg(e.target.value)} type="number" step="0.01" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Density Altitude (ft, optional)</label>
              <input value={densityAltitudeFt} onChange={(e) => setDensityAltitudeFt(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Humidity (%)</label>
              <input value={humidityPercent} onChange={(e) => setHumidityPercent(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Wind Speed (mph)</label>
              <input value={windSpeedMph} onChange={(e) => setWindSpeedMph(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Wind Angle (deg)</label>
              <input value={windAngleDeg} onChange={(e) => setWindAngleDeg(e.target.value)} type="number" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Wind Direction Unit</label>
              <select value={defaultWindDirectionUnit} onChange={(e) => setDefaultWindDirectionUnit(e.target.value as WindDirectionUnit)} className={INPUT_CLASS}>
                <option value="degrees">Degrees</option>
                <option value="clock">Clock</option>
              </select>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div role="alert" className="rounded-md bg-[#E53935]/10 border border-[#E53935]/30 p-3 space-y-1">
              {validationErrors.map((err) => (
                <p key={err} className="text-xs text-[#E53935]">{err}</p>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleGenerate}
              disabled={validationErrors.length > 0}
              className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Estimated Rows
            </button>
            <button
              onClick={handleExport}
              disabled={!rows.length}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </section>

        {/* Wind zones panel (branch 6) */}
        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <label className="inline-flex items-center gap-2 text-sm text-vault-text-muted">
            <input type="checkbox" checked={useZones} onChange={(e) => setUseZones(e.target.checked)} className="accent-[#00C2FF]" />
            Enable multi-zone winds (0-300, 300-700, 700+)
          </label>

          {useZones && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {zones.map((zone, index) => (
                <div key={`${zone.startYd}-${zone.endYd ?? "plus"}`} className="border border-vault-border rounded-md p-3 space-y-2">
                  <p className="text-xs text-vault-text-muted font-mono">
                    Zone {zone.startYd}-{zone.endYd ?? "+"} yd
                  </p>
                  <input
                    className={INPUT_CLASS}
                    type="number"
                    step="0.1"
                    value={zone.speedMph}
                    onChange={(e) => updateZone(index, { speedMph: Number(e.target.value) })}
                    placeholder="Speed (mph)"
                  />
                  <input
                    className={INPUT_CLASS}
                    type="number"
                    value={zone.directionValue}
                    onChange={(e) => updateZone(index, { directionValue: Number(e.target.value) })}
                    placeholder={zone.directionUnit === "clock" ? "Clock (1-12)" : "Direction (deg)"}
                  />
                  <select
                    className={INPUT_CLASS}
                    value={zone.directionUnit}
                    onChange={(e) => updateZone(index, { directionUnit: e.target.value as WindDirectionUnit })}
                  >
                    <option value="degrees">Degrees</option>
                    <option value="clock">Clock</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && (
            <p className="text-xs text-vault-text-muted">{windAssumptionSummary}</p>
          )}
        </section>

        {/* Truing panel (branch 3) */}
        {rows.length > 0 && (
          <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-[#00C2FF] font-mono">Ballistic Truing</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className={LABEL_CLASS}>Adjust</label>
                <select value={truingParameter} onChange={(e) => setTruingParameter(e.target.value as TruingParameter)} className={INPUT_CLASS}>
                  <option value="mv">Muzzle Velocity</option>
                  <option value="bc">Ballistic Coefficient</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Confirmed Distance Row</label>
                <select value={truingDistanceYd} onChange={(e) => setTruingDistanceYd(e.target.value)} className={INPUT_CLASS}>
                  <option value="">Select row</option>
                  {confirmedRows.map((row) => (
                    <option key={row.distanceYd} value={row.distanceYd}>
                      {row.distanceYd} yd
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Observed Elevation (mil)</label>
                <input
                  value={observedElevationMil}
                  onChange={(e) => setObservedElevationMil(e.target.value)}
                  type="number"
                  step="0.01"
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleTrueProfile}
                  className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors"
                >
                  Apply Truing
                </button>
                <button
                  onClick={resetTruing}
                  className="px-4 py-2 text-sm rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            {isTrued && (
              <p className="text-xs text-vault-text-muted">
                Trued values — MV: {truedMv?.toFixed(1)} fps, BC: {truedBc?.toFixed(4)} (untuned preserved for reset).
              </p>
            )}
          </section>
        )}

        {/* Profile management panel (branch 2) */}
        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <h2 className="text-xs uppercase tracking-widest text-vault-text-muted font-mono">Profiles</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Profile name"
              className={`${INPUT_CLASS} max-w-[200px]`}
            />
            <button onClick={saveProfile} className="px-3 py-2 rounded-md border border-vault-border text-xs text-vault-text-muted hover:text-vault-text transition-colors">
              Save
            </button>
          </div>
          {profiles.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className={`${INPUT_CLASS} max-w-[200px]`}>
                <option value="">Select profile</option>
                {profiles.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <button onClick={loadProfile} className="px-3 py-2 rounded-md border border-vault-border text-xs text-vault-text-muted hover:text-vault-text transition-colors">
                Load
              </button>
              <button
                onClick={() => setProfiles((prev) => prev.filter((p) => p.name !== selectedProfile))}
                className="px-3 py-2 rounded-md border border-[#E53935]/30 text-xs text-[#E53935] hover:bg-[#E53935]/10 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => importRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-vault-border text-xs text-vault-text-muted hover:text-vault-text transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Import CSV/JSON
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </div>
        </section>

        {/* Row corrections table */}
        <section className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-vault-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00C853]" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#00C853]">Row Corrections from Confirmed Impacts</h3>
            </div>
            <div className="flex items-center gap-3">
              {isTrued && <span className="text-[11px] uppercase tracking-widest text-[#00C853]">Trued</span>}
              {estimateSummary && <p className="text-xs text-vault-text-muted">{estimateSummary}</p>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-vault-bg/50 text-vault-text-faint uppercase tracking-widest text-[11px]">
                <tr>
                  <th className="text-left px-3 py-2">Distance</th>
                  <th className="text-left px-3 py-2">Drop (in)</th>
                  <th className="text-left px-3 py-2">Drop (MIL)</th>
                  <th className="text-left px-3 py-2">Drop (MOA)</th>
                  <th className="text-left px-3 py-2">Wind (in)</th>
                  <th className="text-left px-3 py-2">Wind (MIL)</th>
                  <th className="text-left px-3 py-2">Wind (MOA)</th>
                  <th className="text-left px-3 py-2">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.distanceYd} className="border-t border-vault-border/60">
                    <td className="px-3 py-2 font-mono">{row.distanceYd} yd</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className={`${INPUT_CLASS} min-w-[110px]`}
                        value={corrections[row.distanceYd]?.dropIn ?? ""}
                        placeholder={String(row.dropIn)}
                        onChange={(e) => updateCorrection(row.distanceYd, { dropIn: parseOptionalNumber(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono">{row.dropMil.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{row.dropMoa.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className={`${INPUT_CLASS} min-w-[110px]`}
                        value={corrections[row.distanceYd]?.windIn ?? ""}
                        placeholder={String(row.windIn)}
                        onChange={(e) => updateCorrection(row.distanceYd, { windIn: parseOptionalNumber(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono">{row.windMil.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{row.windMoa.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.confirmed}
                        onChange={(e) => updateCorrection(row.distanceYd, { confirmed: e.target.checked })}
                        className="w-4 h-4 accent-[#00C853]"
                      />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-vault-text-faint">
                      Generate estimated rows to begin your dope card.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
