"use client";

import { useMemo, useState } from "react";
import { Crosshair, Wind, Gauge, Mountain, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { buildDopeCard, type BallisticsInputs } from "@/lib/ballistics";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";

const DEFAULTS: BallisticsInputs = {
  muzzleVelocityFps: 2650,
  ballisticCoefficientG1: 0.47,
  zeroRangeYards: 100,
  sightHeightInches: 1.8,
  windSpeedMph: 10,
  temperatureF: 59,
  altitudeFeet: 0,
  startRangeYards: 100,
  endRangeYards: 800,
  stepYards: 50,
};

function fmt(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "-";
}

export default function BallisticsPage() {
  const [inputs, setInputs] = useState<BallisticsInputs>(DEFAULTS);

  const rows = useMemo(() => buildDopeCard(inputs), [inputs]);

  function updateNumber<K extends keyof BallisticsInputs>(key: K, value: string) {
    const parsed = Number.parseFloat(value);
    setInputs((prev) => ({ ...prev, [key]: Number.isFinite(parsed) ? parsed : 0 }));
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="BALLISTICS DOPE CARD"
        subtitle="Generate elevation and wind holds by distance for your load"
      />

      <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Muzzle Velocity (fps)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.muzzleVelocityFps} onChange={(e) => updateNumber("muzzleVelocityFps", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Ballistic Coefficient (G1)</span>
            <input className={INPUT_CLASS} type="number" step="0.01" value={inputs.ballisticCoefficientG1} onChange={(e) => updateNumber("ballisticCoefficientG1", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Zero Range (yd)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.zeroRangeYards} onChange={(e) => updateNumber("zeroRangeYards", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Sight Height (in)</span>
            <input className={INPUT_CLASS} type="number" step="0.1" value={inputs.sightHeightInches} onChange={(e) => updateNumber("sightHeightInches", e.target.value)} />
          </label>
        </div>

        <div className="grid lg:grid-cols-4 sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Wind Speed (mph)</span>
            <input className={INPUT_CLASS} type="number" step="0.5" value={inputs.windSpeedMph} onChange={(e) => updateNumber("windSpeedMph", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Temperature (°F)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.temperatureF} onChange={(e) => updateNumber("temperatureF", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Altitude (ft)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.altitudeFeet} onChange={(e) => updateNumber("altitudeFeet", e.target.value)} />
          </label>
          <button
            type="button"
            onClick={() => setInputs(DEFAULTS)}
            className="self-end h-[38px] rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/40 transition-colors inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Start Range (yd)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.startRangeYards} onChange={(e) => updateNumber("startRangeYards", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">End Range (yd)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.endRangeYards} onChange={(e) => updateNumber("endRangeYards", e.target.value)} />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-widest text-vault-text-faint">Step (yd)</span>
            <input className={INPUT_CLASS} type="number" value={inputs.stepYards} onChange={(e) => updateNumber("stepYards", e.target.value)} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <div className="text-vault-text-faint text-xs flex items-center gap-2"><Crosshair className="w-4 h-4 text-[#00C2FF]" /> Zero</div>
            <p className="mt-1 text-lg font-mono text-vault-text">{fmt(inputs.zeroRangeYards, 0)} yd / {fmt(inputs.sightHeightInches, 1)} in</p>
          </div>
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <div className="text-vault-text-faint text-xs flex items-center gap-2"><Wind className="w-4 h-4 text-[#00C2FF]" /> Full Value Wind</div>
            <p className="mt-1 text-lg font-mono text-vault-text">{fmt(inputs.windSpeedMph, 1)} mph</p>
          </div>
          <div className="rounded-lg border border-vault-border bg-vault-surface p-3">
            <div className="text-vault-text-faint text-xs flex items-center gap-2"><Mountain className="w-4 h-4 text-[#00C2FF]" /> Atmosphere</div>
            <p className="mt-1 text-lg font-mono text-vault-text">{fmt(inputs.temperatureF, 0)}°F / {fmt(inputs.altitudeFeet, 0)} ft</p>
          </div>
        </div>

        <div className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-vault-border flex items-center gap-2 text-xs uppercase tracking-widest text-vault-text-faint">
            <Gauge className="w-4 h-4 text-[#00C2FF]" /> DOPE Card
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-vault-bg/70 text-vault-text-faint text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">Range (yd)</th>
                  <th className="text-right px-3 py-2">Drop (in)</th>
                  <th className="text-right px-3 py-2">Drift (in)</th>
                  <th className="text-right px-3 py-2">Elev (MIL)</th>
                  <th className="text-right px-3 py-2">Wind (MIL)</th>
                  <th className="text-right px-3 py-2">Elev (MOA)</th>
                  <th className="text-right px-3 py-2">Wind (MOA)</th>
                  <th className="text-right px-3 py-2">Vel (fps)</th>
                  <th className="text-right px-3 py-2">TOF (s)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rangeYards} className="border-t border-vault-border/70">
                    <td className="px-3 py-2 font-mono text-vault-text">{row.rangeYards}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text">{fmt(row.dropInches, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text">{fmt(row.driftInches, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#00C2FF]">{fmt(row.elevationMil, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#00C2FF]">{fmt(row.windMil, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text-muted">{fmt(row.elevationMoa, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text-muted">{fmt(row.windMoa, 2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text">{fmt(row.velocityFps, 0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-vault-text">{fmt(row.timeOfFlightSec, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
