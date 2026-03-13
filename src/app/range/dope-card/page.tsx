"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  applyDopeCorrections,
  convertDropWindToAngular,
  generateDistanceRows,
  type AngularDopeRow,
  type DopeRowCorrection,
} from "@/lib/ballistics/dope";
import { solveTrajectoryRows, type DragModel } from "@/lib/ballistics/solver";
import { Calculator, Target } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  const [rows, setRows] = useState<AngularDopeRow[]>([]);
  const [corrections, setCorrections] = useState<Record<number, DopeRowCorrection>>({});
  const [generatorErrors, setGeneratorErrors] = useState<string[]>([]);
  const estimationModel = "Physics-based nonlinear stepper";

  const validationErrors = useMemo(
    () =>
      validateGeneratorInputs({
        startYd,
        endYd,
        stepYd,
        muzzleVelocityFps,
        ballisticCoefficient,
        zeroRangeYd,
        sightHeightIn,
      }),
    [startYd, endYd, stepYd, muzzleVelocityFps, ballisticCoefficient, zeroRangeYd, sightHeightIn]
  );
  const hasInvalidInputs = validationErrors.length > 0;

  const estimateSummary = useMemo(() => {
    if (!rows.length) return null;
    const confirmedCount = rows.filter((r) => r.confirmed).length;
    return `${confirmedCount}/${rows.length} rows confirmed from impacts`;
  }, [rows]);

  function handleGenerate() {
    if (validationErrors.length > 0) {
      setGeneratorErrors(validationErrors);
      return;
    }

    setGeneratorErrors([]);

    const distanceRows = generateDistanceRows(Number(startYd), Number(endYd), Number(stepYd));
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
    const merged: DopeRowCorrection = {
      ...existing,
      ...patch,
    };

    if (patch.dropIn === undefined) {
      delete merged.dropIn;
    }

    if (patch.windIn === undefined) {
      delete merged.windIn;
    }

    const hasAnyCorrection =
      merged.dropIn !== undefined || merged.windIn !== undefined || merged.confirmed !== undefined;
    const nextCorrections = {
      ...corrections,
      ...(hasAnyCorrection ? { [distanceYd]: merged } : {}),
    };

    if (!hasAnyCorrection) {
      delete nextCorrections[distanceYd];
    }

    setCorrections(nextCorrections);
    setRows((prev) => applyDopeCorrections(prev, nextCorrections));
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="DOPE CARD BUILDER"
        subtitle="Generate an estimated card, then overwrite each row from confirmed impacts"
      />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg p-4 space-y-1">
          <p className="text-sm text-[#F5A623] font-medium">
            Estimate only: this builder is a starting point and is not a replacement for verified firing data.
          </p>
          <p className="text-xs text-vault-text-muted">Estimation model: {estimationModel}</p>
        </div>

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
          </div>

          <button
            onClick={handleGenerate}
            disabled={hasInvalidInputs}
            className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#00C2FF]/10"
          >
            Generate Estimated Rows
          </button>
          {generatorErrors.length > 0 && (
            <p className="text-sm text-red-400" role="alert">
              {generatorErrors.join(" ")}
            </p>
          )}
        </section>

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
