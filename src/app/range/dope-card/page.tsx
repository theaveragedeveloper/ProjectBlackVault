"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  applyDopeCorrections,
  convertDropWindToAngular,
  generateDistanceRows,
  type AngularDopeRow,
  type DopeRowCorrection,
  type WindDirectionUnit,
  type WindZoneInput,
} from "@/lib/ballistics/dope";
import { solveTrajectoryRows, type DragModel } from "@/lib/ballistics/solver";
import { Calculator, Download, Target } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function createZone(startYd: number, endYd: number | null): WindZoneInput {
  return {
    startYd,
    endYd,
    speedMph: 0,
    directionValue: 90,
    directionUnit: "degrees",
  };
}

function formatDirection(value: number, unit: WindDirectionUnit): string {
  return unit === "clock" ? `${value} o'clock` : `${value}°`;
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

  const [defaultWindDirectionUnit, setDefaultWindDirectionUnit] = useState<WindDirectionUnit>("degrees");
  const [useZones, setUseZones] = useState(false);
  const [zones, setZones] = useState<WindZoneInput[]>([createZone(0, 300), createZone(300, 700), createZone(700, null)]);

  const [rows, setRows] = useState<AngularDopeRow[]>([]);
  const [corrections, setCorrections] = useState<Record<number, DopeRowCorrection>>({});
  const estimationModel = "Physics-based nonlinear stepper";

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
        const startLabel = `${zone.startYd}`;
        return `${startLabel}${endLabel} yd: ${zone.speedMph} mph @ ${formatDirection(zone.directionValue, zone.directionUnit)}`;
      })
      .join(" • ");

    return `Zone winds: ${zoneSummary}`;
  }, [defaultWindDirectionUnit, windAngleDeg, windSpeedMph, useZones, zones]);

  function updateZone(index: number, patch: Partial<WindZoneInput>) {
    setZones((prev) => prev.map((zone, currentIndex) => (currentIndex === index ? { ...zone, ...patch } : zone)));
  }

  function handleGenerate() {
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
    const link = document.createElement("a");
    link.href = url;
    link.download = "dope-card.csv";
    link.click();
    URL.revokeObjectURL(url);
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
            <div>
              <label className={LABEL_CLASS}>Wind Direction Unit</label>
              <select
                className={INPUT_CLASS}
                value={defaultWindDirectionUnit}
                onChange={(e) => setDefaultWindDirectionUnit(e.target.value as WindDirectionUnit)}
              >
                <option value="degrees">Degrees (0-360)</option>
                <option value="clock">Clock (1-12)</option>
              </select>
            </div>
          </div>

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
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={INPUT_CLASS}
                      value={zone.directionUnit}
                      onChange={(e) => updateZone(index, { directionUnit: e.target.value as WindDirectionUnit })}
                    >
                      <option value="degrees">Deg</option>
                      <option value="clock">Clock</option>
                    </select>
                    <input
                      className={INPUT_CLASS}
                      type="number"
                      value={zone.directionValue}
                      onChange={(e) => updateZone(index, { directionValue: Number(e.target.value) })}
                      min={zone.directionUnit === "degrees" ? 0 : 1}
                      max={zone.directionUnit === "degrees" ? 360 : 12}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerate}
              className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors"
            >
              Generate Estimated Rows
            </button>
            <button
              onClick={handleExport}
              disabled={!rows.length}
              className="px-4 py-2 text-sm rounded-md bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 transition-colors disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1">
                <Download className="w-4 h-4" /> Export CSV
              </span>
            </button>
          </div>
        </section>

        <section className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-vault-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[#00C853]" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-[#00C853]">Row Corrections from Confirmed Impacts</h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-vault-text-muted">{windAssumptionSummary}</p>
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
