"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  applyDopeCorrections,
  convertDropWindToAngular,
  generateDistanceRows,
  type AngularDopeRow,
  type DopeRowCorrection,
} from "@/lib/ballistics/dope";
import { solveTrajectoryRows, type DragModel } from "@/lib/ballistics/solver";
import { Calculator, Download, Target, Upload } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";
const STORAGE_KEY = "pbv-dope-card-profiles-v1";

type DistanceUnit = "yd" | "m";
type AngularUnit = "mil" | "moa";

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
    distanceUnit: DistanceUnit;
    angularUnit: AngularUnit;
    milClickValue: string;
    moaClickValue: string;
    rows: AngularDopeRow[];
    corrections: Record<number, DopeRowCorrection>;
  };
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function DopeCardPage() {
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

  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("yd");
  const [angularUnit, setAngularUnit] = useState<AngularUnit>("mil");
  const [milClickValue, setMilClickValue] = useState("0.1");
  const [moaClickValue, setMoaClickValue] = useState("0.25");

  const [rows, setRows] = useState<AngularDopeRow[]>([]);
  const [corrections, setCorrections] = useState<Record<number, DopeRowCorrection>>({});
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

  const estimationModel = "Physics-based nonlinear stepper";

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  const estimateSummary = useMemo(() => {
    if (!rows.length) return null;
    const confirmedCount = rows.filter((r) => r.confirmed).length;
    return `${confirmedCount}/${rows.length} rows confirmed from impacts`;
  }, [rows]);

  const activeClickValue = angularUnit === "mil" ? Number(milClickValue) : Number(moaClickValue);

  function handleGenerate() {
    const toYd = distanceUnit === "m" ? 1.09361 : 1;
    const distanceRows = generateDistanceRows(
      Number(startYd) * toYd,
      Number(endYd) * toYd,
      Number(stepYd) * toYd,
    );
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

    setCorrections({});
    setRows(convertDropWindToAngular(solvedRows));
  }

  function updateCorrection(distanceYd: number, patch: DopeRowCorrection) {
    const existing = corrections[distanceYd] ?? {};
    const merged: DopeRowCorrection = { ...existing, ...patch };

    if (patch.dropIn === undefined) delete merged.dropIn;
    if (patch.windIn === undefined) delete merged.windIn;

    const hasAnyCorrection =
      merged.dropIn !== undefined || merged.windIn !== undefined || merged.confirmed !== undefined;
    const nextCorrections = {
      ...corrections,
      ...(hasAnyCorrection ? { [distanceYd]: merged } : {}),
    };
    if (!hasAnyCorrection) delete nextCorrections[distanceYd];

    setCorrections(nextCorrections);
    setRows((prev) => applyDopeCorrections(prev, nextCorrections));
  }

  function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    const payload = {
      startYd, endYd, stepYd,
      muzzleVelocityFps, ballisticCoefficient, dragModel,
      zeroRangeYd, sightHeightIn, twistIn, temperatureF, pressureInHg,
      densityAltitudeFt, humidityPercent, windSpeedMph, windAngleDeg,
      distanceUnit, angularUnit, milClickValue, moaClickValue,
      rows, corrections,
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
    setDistanceUnit(p.distanceUnit); setAngularUnit(p.angularUnit);
    setMilClickValue(p.milClickValue); setMoaClickValue(p.moaClickValue);
    setRows(p.rows); setCorrections(p.corrections);
    setProfileName(profile.name);
  }

  function exportJson() {
    const data = {
      rows, corrections, startYd, endYd, stepYd,
      muzzleVelocityFps, ballisticCoefficient, dragModel,
      zeroRangeYd, sightHeightIn, distanceUnit, angularUnit, milClickValue, moaClickValue,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dope-card.json"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const lines = ["distanceYd,dropIn,dropMil,dropMoa,windIn,windMil,windMoa,confirmed"];
    rows.forEach((row) =>
      lines.push([row.distanceYd, row.dropIn, row.dropMil, row.dropMoa, row.windIn, row.windMil, row.windMoa, row.confirmed].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dope-card.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function importFile(file?: File) {
    if (!file) return;
    file.text().then((text) => {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.rows)) setRows(parsed.rows);
        if (parsed.corrections) setCorrections(parsed.corrections);
        if (parsed.startYd) setStartYd(parsed.startYd);
        if (parsed.endYd) setEndYd(parsed.endYd);
      } else {
        const [, ...data] = text.trim().split("\n");
        const importedRows = data.map((line) => {
          const [distanceYd, dropIn, dropMil, dropMoa, windIn, windMil, windMoa, confirmed] = line.split(",");
          return {
            distanceYd: Number(distanceYd), dropIn: Number(dropIn),
            dropMil: Number(dropMil), dropMoa: Number(dropMoa),
            windIn: Number(windIn), windMil: Number(windMil), windMoa: Number(windMoa),
            confirmed: confirmed === "true",
          };
        });
        setRows(importedRows);
      }
    });
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="DOPE CARD BUILDER"
        subtitle="Generate estimates, convert to clicks, and save/share complete card profiles"
      />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg p-4 space-y-1">
          <p className="text-sm text-[#F5A623] font-medium">
            Estimate only: this builder is a starting point and is not a replacement for verified firing data.
          </p>
          <p className="text-xs text-vault-text-muted">Estimation model: {estimationModel}</p>
        </div>

        {/* Profile & Display Settings */}
        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className={LABEL_CLASS}>Distance Unit</label>
              <div className="flex gap-2">
                <button onClick={() => setDistanceUnit("yd")} className={`px-3 py-2 rounded-md border text-xs ${distanceUnit === "yd" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`}>Yards</button>
                <button onClick={() => setDistanceUnit("m")} className={`px-3 py-2 rounded-md border text-xs ${distanceUnit === "m" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`}>Meters</button>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Scope Click Display</label>
              <div className="flex gap-2">
                <button onClick={() => setAngularUnit("mil")} className={`px-3 py-2 rounded-md border text-xs ${angularUnit === "mil" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`}>MIL</button>
                <button onClick={() => setAngularUnit("moa")} className={`px-3 py-2 rounded-md border text-xs ${angularUnit === "moa" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`}>MOA</button>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>MIL Click Value</label>
              <input className={INPUT_CLASS} value={milClickValue} onChange={(e) => setMilClickValue(e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>MOA Click Value</label>
              <input className={INPUT_CLASS} value={moaClickValue} onChange={(e) => setMoaClickValue(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${INPUT_CLASS} max-w-56`}
              placeholder="Profile name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
            <button onClick={saveProfile} className="px-3 py-2 rounded-md border border-vault-border text-xs">Save Profile</button>
            <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className={`${INPUT_CLASS} max-w-56`}>
              <option value="">Load saved profile…</option>
              {profiles.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
            <button onClick={loadProfile} className="px-3 py-2 rounded-md border border-vault-border text-xs">Load</button>
            <button onClick={exportCsv} className="px-3 py-2 rounded-md border border-vault-border text-xs inline-flex items-center gap-1"><Download className="w-3 h-3" />CSV</button>
            <button onClick={exportJson} className="px-3 py-2 rounded-md border border-vault-border text-xs inline-flex items-center gap-1"><Download className="w-3 h-3" />JSON</button>
            <button onClick={() => importRef.current?.click()} className="px-3 py-2 rounded-md border border-vault-border text-xs inline-flex items-center gap-1"><Upload className="w-3 h-3" />Import</button>
            <input ref={importRef} type="file" accept=".csv,.json" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
          </div>
        </section>

        {/* Ballistic Inputs */}
        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-xs uppercase tracking-widest text-[#00C2FF] font-mono">Auto-Populate Estimates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className={LABEL_CLASS}>Start ({distanceUnit})</label>
              <input value={startYd} onChange={(e) => setStartYd(e.target.value)} type="number" min={1} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>End ({distanceUnit})</label>
              <input value={endYd} onChange={(e) => setEndYd(e.target.value)} type="number" min={1} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Step ({distanceUnit})</label>
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
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors"
          >
            Generate Estimated Rows
          </button>
        </section>

        {/* DOPE Table */}
        <section className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-vault-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00C853]" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#00C853]">Row Corrections from Confirmed Impacts</h3>
            </div>
            {estimateSummary && <p className="text-xs text-vault-text-muted">{estimateSummary}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-vault-bg/50 text-vault-text-faint uppercase tracking-widest text-[11px]">
                <tr>
                  <th className="text-left px-3 py-2">Distance</th>
                  <th className="text-left px-3 py-2">Drop (in)</th>
                  <th className="text-left px-3 py-2">Drop ({angularUnit.toUpperCase()})</th>
                  <th className="text-left px-3 py-2">Wind (in)</th>
                  <th className="text-left px-3 py-2">Wind ({angularUnit.toUpperCase()})</th>
                  <th className="text-left px-3 py-2">Clicks Up</th>
                  <th className="text-left px-3 py-2">Clicks Wind</th>
                  <th className="text-left px-3 py-2">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const displayDistance = distanceUnit === "m" ? row.distanceYd / 1.09361 : row.distanceYd;
                  const dropAngular = angularUnit === "mil" ? row.dropMil : row.dropMoa;
                  const windAngular = angularUnit === "mil" ? row.windMil : row.windMoa;
                  const clickUp = activeClickValue > 0 ? Math.round(dropAngular / activeClickValue) : 0;
                  const clickWind = activeClickValue > 0 ? Math.round(windAngular / activeClickValue) : 0;
                  return (
                    <tr key={row.distanceYd} className="border-t border-vault-border/60">
                      <td className="px-3 py-2 font-mono">{displayDistance.toFixed(0)} {distanceUnit}</td>
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
                      <td className="px-3 py-2 font-mono">{dropAngular.toFixed(2)}</td>
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
                      <td className="px-3 py-2 font-mono">{windAngular.toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono">{clickUp}</td>
                      <td className="px-3 py-2 font-mono">{clickWind}</td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.confirmed}
                          onChange={(e) => updateCorrection(row.distanceYd, { confirmed: e.target.checked })}
                          className="w-4 h-4 accent-[#00C853]"
                        />
                      </td>
                    </tr>
                  );
                })}
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
