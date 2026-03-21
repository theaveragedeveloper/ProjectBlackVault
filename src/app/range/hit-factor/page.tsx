"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  Target,
  Timer,
  AlertTriangle,
  ChevronDown,
  Info,
  Zap,
  TrendingUp,
  RotateCcw,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors text-center font-mono";
const LABEL_CLASS = "block text-[10px] font-medium uppercase tracking-widest text-vault-text-faint mb-1 text-center";

// Truncate to 4 decimal places (USPSA spec — no rounding)
function truncate4(n: number): string {
  if (!isFinite(n) || n < 0) return "0.0000";
  return Math.trunc(n * 10000) / 10000 === 0
    ? "0.0000"
    : (Math.trunc(n * 10000) / 10000).toFixed(4);
}

const ZONE_POINTS = {
  major: { alpha: 5, charlie: 4, delta: 2, steel: 5 },
  minor: { alpha: 5, charlie: 3, delta: 1, steel: 5 },
} as const;

const PENALTY = -10;

type PowerFactor = "major" | "minor";

function Counter({
  label,
  value,
  onChange,
  color = "default",
  sublabel,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: "blue" | "yellow" | "red" | "green" | "default";
  sublabel?: string;
}) {
  const colorMap = {
    blue: "border-[#00C2FF]/30 bg-[#00C2FF]/5 text-[#00C2FF]",
    yellow: "border-[#F5A623]/30 bg-[#F5A623]/5 text-[#F5A623]",
    red: "border-[#E53935]/30 bg-[#E53935]/5 text-[#E53935]",
    green: "border-[#00C853]/30 bg-[#00C853]/5 text-[#00C853]",
    default: "border-vault-border bg-vault-surface text-vault-text",
  };
  const btnBase = "w-8 h-8 rounded-md border flex items-center justify-center text-lg font-bold transition-all select-none active:scale-95";

  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <p className={LABEL_CLASS}>{label}</p>
      {sublabel && <p className="text-[9px] text-center text-vault-text-faint mb-1.5">{sublabel}</p>}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className={`${btnBase} border-vault-border bg-vault-bg text-vault-text-muted hover:border-vault-text-muted/50 hover:text-vault-text`}
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-12 bg-transparent border-0 text-center font-mono font-bold text-lg focus:outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className={`${btnBase} border-vault-border bg-vault-bg text-vault-text-muted hover:border-vault-text-muted/50 hover:text-vault-text`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function HitFactorCalculatorPage() {
  // Power factor
  const [powerFactor, setPowerFactor] = useState<PowerFactor>("minor");

  // Hit counts
  const [alpha, setAlpha] = useState(0);
  const [charlie, setCharlie] = useState(0);
  const [delta, setDelta] = useState(0);
  const [steel, setSteel] = useState(0);

  // Penalties
  const [misses, setMisses] = useState(0);
  const [noShoots, setNoShoots] = useState(0);
  const [procedurals, setProcedurals] = useState(0);

  // Time
  const [timeStr, setTimeStr] = useState("");

  // Stage winner HF (for stage %)
  const [winnerHFStr, setWinnerHFStr] = useState("");

  // Power Factor auto-calculator
  const [showPFCalc, setShowPFCalc] = useState(false);
  const [bulletWeight, setBulletWeight] = useState("");
  const [velocity, setVelocity] = useState("");

  const computedPF = useMemo(() => {
    const w = parseFloat(bulletWeight);
    const v = parseFloat(velocity);
    if (!w || !v) return null;
    return Math.floor((w * v) / 1000);
  }, [bulletWeight, velocity]);

  const pz = ZONE_POINTS[powerFactor];

  const calculation = useMemo(() => {
    const time = parseFloat(timeStr);
    const pts = {
      alpha: alpha * pz.alpha,
      charlie: charlie * pz.charlie,
      delta: delta * pz.delta,
      steel: steel * pz.steel,
    };
    const totalHits = alpha + charlie + delta + steel;
    const grossPoints = pts.alpha + pts.charlie + pts.delta + pts.steel;
    const penaltyCount = misses + noShoots + procedurals;
    const penaltyPoints = penaltyCount * PENALTY;
    const netPoints = grossPoints + penaltyPoints;
    const totalShots = totalHits + misses;

    const hitFactor = time > 0 ? netPoints / time : null;
    const hitFactorStr = hitFactor != null ? truncate4(hitFactor) : null;

    // What-if: all Alphas (same total shots, same time)
    // If all shots were Alphas instead of C/D/M
    const whatIfAlphaGross = (alpha + charlie + delta + misses) * pz.alpha + steel * pz.steel;
    const whatIfAlphaNet = whatIfAlphaGross; // no penalties since no misses assumed
    const whatIfAlphaHF = time > 0 ? whatIfAlphaNet / time : null;

    // What-if: no penalties (same hits, remove misses/no-shoots/procedurals)
    const whatIfNoPenNet = grossPoints;
    const whatIfNoPenHF = time > 0 ? whatIfNoPenNet / time : null;

    // Stage %
    const winnerHF = parseFloat(winnerHFStr);
    const stagePercent =
      hitFactor != null && winnerHF > 0 ? Math.min(100, (hitFactor / winnerHF) * 100) : null;

    return {
      pts,
      grossPoints,
      penaltyPoints,
      netPoints,
      penaltyCount,
      totalHits,
      hitFactor,
      hitFactorStr,
      whatIfAlphaHF,
      whatIfNoPenHF,
      stagePercent,
      time,
      totalShots,
    };
  }, [alpha, charlie, delta, steel, misses, noShoots, procedurals, timeStr, pz, winnerHFStr]);

  function reset() {
    setAlpha(0); setCharlie(0); setDelta(0); setSteel(0);
    setMisses(0); setNoShoots(0); setProcedurals(0);
    setTimeStr(""); setWinnerHFStr("");
  }

  const hfNum = calculation.hitFactor ?? 0;
  const hfColor =
    hfNum >= 8 ? "text-[#00C853]" :
    hfNum >= 5 ? "text-[#00C2FF]" :
    hfNum >= 3 ? "text-[#F5A623]" :
    "text-[#E53935]";

  return (
    <div className="min-h-full">
      <PageHeader
        title="HIT FACTOR CALCULATOR"
        subtitle="USPSA / IPSC stage scoring — points per second"
      />

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* What is Hit Factor info strip */}
        <div className="flex items-start gap-3 bg-vault-surface border border-vault-border rounded-lg px-4 py-3">
          <Info className="w-4 h-4 text-[#00C2FF] shrink-0 mt-0.5" />
          <p className="text-xs text-vault-text-muted">
            <span className="text-vault-text font-medium">Hit Factor</span> = (Total Points − Penalties) ÷ Time.
            The higher the number, the better. Result is <em>truncated</em> (not rounded) to 4 decimal places per USPSA rules.
          </p>
        </div>

        {/* Power Factor selector */}
        <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#F5A623]" />
              <span className="text-xs font-mono uppercase tracking-widest text-vault-text-muted">Power Factor</span>
            </div>
            <button
              onClick={() => setShowPFCalc(!showPFCalc)}
              className="text-xs text-[#00C2FF] hover:underline flex items-center gap-1"
            >
              Calculate PF <ChevronDown className={`w-3 h-3 transition-transform ${showPFCalc ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="flex gap-3">
            {(["minor", "major"] as PowerFactor[]).map((pf) => (
              <button
                key={pf}
                onClick={() => setPowerFactor(pf)}
                className={`flex-1 py-2.5 rounded-md border text-sm font-medium transition-colors ${
                  powerFactor === pf
                    ? pf === "major"
                      ? "bg-[#F5A623]/10 border-[#F5A623]/40 text-[#F5A623]"
                      : "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                    : "bg-vault-bg border-vault-border text-vault-text-muted hover:border-vault-text-muted/50"
                }`}
              >
                {pf === "major" ? "Major (PF ≥ 165)" : "Minor (PF 125–164)"}
              </button>
            ))}
          </div>

          {/* PF table */}
          <div className="mt-3 grid grid-cols-4 gap-1 text-xs text-center">
            {[
              { label: "Alpha", major: 5, minor: 5, color: "text-[#00C853]" },
              { label: "Charlie", major: 4, minor: 3, color: "text-[#F5A623]" },
              { label: "Delta", major: 2, minor: 1, color: "text-[#E53935]" },
              { label: "Steel", major: 5, minor: 5, color: "text-[#00C2FF]" },
            ].map(({ label, major, minor, color }) => (
              <div key={label} className="bg-vault-bg border border-vault-border rounded px-2 py-1.5">
                <p className={`font-mono font-bold ${color}`}>
                  {powerFactor === "major" ? major : minor} pts
                </p>
                <p className="text-vault-text-faint text-[10px]">{label}</p>
              </div>
            ))}
          </div>

          {/* PF auto-calculator */}
          {showPFCalc && (
            <div className="mt-4 border-t border-vault-border pt-4 space-y-3">
              <p className="text-xs text-vault-text-faint">PF = (Bullet Weight gr × Muzzle Velocity fps) ÷ 1000</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Bullet Weight (gr)</label>
                  <input type="number" min={0} value={bulletWeight}
                    onChange={(e) => setBulletWeight(e.target.value)}
                    placeholder="147" className={INPUT_CLASS} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Velocity (fps)</label>
                  <input type="number" min={0} value={velocity}
                    onChange={(e) => setVelocity(e.target.value)}
                    placeholder="1000" className={INPUT_CLASS} />
                </div>
              </div>
              {computedPF != null && (
                <div className="flex items-center justify-between bg-vault-bg border border-vault-border rounded-md px-4 py-2">
                  <span className="text-sm text-vault-text-muted">Computed Power Factor</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-mono font-bold ${computedPF >= 165 ? "text-[#F5A623]" : computedPF >= 125 ? "text-[#00C2FF]" : "text-[#E53935]"}`}>
                      {computedPF}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${computedPF >= 165 ? "border-[#F5A623]/30 text-[#F5A623]" : computedPF >= 125 ? "border-[#00C2FF]/30 text-[#00C2FF]" : "border-[#E53935]/30 text-[#E53935]"}`}>
                      {computedPF >= 165 ? "Major" : computedPF >= 125 ? "Minor" : "Illegal"}
                    </span>
                    {computedPF >= 125 && (
                      <button
                        onClick={() => setPowerFactor(computedPF >= 165 ? "major" : "minor")}
                        className="text-xs text-[#00C2FF] hover:underline"
                      >
                        Use this →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hit counters */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Hits
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Counter label="Alpha" sublabel={`${pz.alpha} pts ea`} value={alpha} onChange={setAlpha} color="green" />
            <Counter label="Charlie" sublabel={`${pz.charlie} pts ea`} value={charlie} onChange={setCharlie} color="yellow" />
            <Counter label="Delta" sublabel={`${pz.delta} pt${pz.delta !== 1 ? "s" : ""} ea`} value={delta} onChange={setDelta} color="red" />
            <Counter label="Steel" sublabel="5 pts ea (knocked)" value={steel} onChange={setSteel} color="blue" />
          </div>
        </div>

        {/* Penalty counters */}
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Penalties (−10 pts each)
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Counter label="Misses" value={misses} onChange={setMisses} color="red" />
            <Counter label="No-Shoots" value={noShoots} onChange={setNoShoots} color="red" />
            <Counter label="Procedurals" value={procedurals} onChange={setProcedurals} color="red" />
          </div>
        </div>

        {/* Time input */}
        <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-4 h-4 text-[#00C2FF]" />
            <span className="text-xs font-mono uppercase tracking-widest text-vault-text-muted">Stage Time</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className={LABEL_CLASS}>Time (seconds)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                placeholder="e.g. 18.42"
                className={`${INPUT_CLASS} text-xl`}
              />
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div className={`bg-vault-surface border rounded-lg p-6 ${calculation.hitFactorStr ? "border-[#00C2FF]/30" : "border-vault-border"}`}>
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-2">Hit Factor</p>
            <p className={`text-6xl font-mono font-bold tracking-tight ${calculation.hitFactorStr ? hfColor : "text-vault-text-faint"}`}>
              {calculation.hitFactorStr ?? "—"}
            </p>
            {calculation.hitFactorStr && (
              <p className="text-xs text-vault-text-faint mt-1">points per second</p>
            )}
          </div>

          {/* Breakdown */}
          {(calculation.totalHits > 0 || calculation.penaltyCount > 0) && (
            <div className="border-t border-vault-border pt-4 space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-3">Score Breakdown</p>

              <div className="space-y-1.5 text-sm">
                {alpha > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">{alpha}× Alpha</span>
                    <span className="font-mono text-[#00C853]">+{calculation.pts.alpha}</span>
                  </div>
                )}
                {charlie > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">{charlie}× Charlie</span>
                    <span className="font-mono text-[#F5A623]">+{calculation.pts.charlie}</span>
                  </div>
                )}
                {delta > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">{delta}× Delta</span>
                    <span className="font-mono text-[#E53935]">+{calculation.pts.delta}</span>
                  </div>
                )}
                {steel > 0 && (
                  <div className="flex justify-between">
                    <span className="text-vault-text-muted">{steel}× Steel</span>
                    <span className="font-mono text-[#00C2FF]">+{calculation.pts.steel}</span>
                  </div>
                )}
                {calculation.penaltyCount > 0 && (
                  <div className="flex justify-between border-t border-vault-border pt-1.5">
                    <span className="text-vault-text-muted">
                      {misses > 0 && `${misses}M `}{noShoots > 0 && `${noShoots}NS `}{procedurals > 0 && `${procedurals}P`} Penalties
                    </span>
                    <span className="font-mono text-[#E53935]">{calculation.penaltyPoints}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-vault-border pt-1.5 font-semibold">
                  <span className="text-vault-text">Net Points</span>
                  <span className={`font-mono ${calculation.netPoints >= 0 ? "text-vault-text" : "text-[#E53935]"}`}>
                    {calculation.netPoints}
                  </span>
                </div>
                {calculation.time > 0 && (
                  <div className="flex justify-between text-vault-text-faint text-xs">
                    <span>÷ Time</span>
                    <span className="font-mono">{calculation.time}s</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* What-if section */}
        {calculation.hitFactorStr && calculation.time > 0 && (
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#00C2FF]" />
              <span className="text-xs font-mono uppercase tracking-widest text-vault-text-muted">What-If Scenarios</span>
            </div>
            <div className="space-y-3">
              {/* All Alphas */}
              {(charlie > 0 || delta > 0 || misses > 0) && calculation.whatIfAlphaHF != null && (
                <div className="flex items-center justify-between bg-vault-bg border border-vault-border rounded-md px-4 py-2.5">
                  <div>
                    <p className="text-sm text-vault-text">All shots → Alpha</p>
                    <p className="text-xs text-vault-text-faint">Same time, {calculation.totalHits + misses} total shots, no penalties</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono font-bold text-[#00C853]">{truncate4(calculation.whatIfAlphaHF)}</p>
                    <p className="text-xs text-[#00C853]">
                      +{truncate4(calculation.whatIfAlphaHF - (calculation.hitFactor ?? 0))} vs actual
                    </p>
                  </div>
                </div>
              )}

              {/* No penalties */}
              {calculation.penaltyCount > 0 && calculation.whatIfNoPenHF != null && (
                <div className="flex items-center justify-between bg-vault-bg border border-vault-border rounded-md px-4 py-2.5">
                  <div>
                    <p className="text-sm text-vault-text">No penalties</p>
                    <p className="text-xs text-vault-text-faint">Remove {calculation.penaltyCount} penalty × 10 pts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-mono font-bold text-[#F5A623]">{truncate4(calculation.whatIfNoPenHF)}</p>
                    <p className="text-xs text-[#F5A623]">
                      +{truncate4(calculation.whatIfNoPenHF - (calculation.hitFactor ?? 0))} vs actual
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage % calculator */}
        {calculation.hitFactorStr && (
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-[#00C2FF]" />
              <span className="text-xs font-mono uppercase tracking-widest text-vault-text-muted">Stage Percentage</span>
            </div>
            <p className="text-xs text-vault-text-faint mb-3">
              Enter the stage winner&apos;s hit factor to calculate your stage score (70 points max awarded to winner).
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className={LABEL_CLASS}>Winner&apos;s Hit Factor</label>
                <input type="number" min={0} step={0.0001} value={winnerHFStr}
                  onChange={(e) => setWinnerHFStr(e.target.value)}
                  placeholder="e.g. 8.4312" className={INPUT_CLASS} />
              </div>
              {calculation.stagePercent != null && (
                <div className="text-center min-w-[90px]">
                  <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-1">Your %</p>
                  <p className={`text-3xl font-mono font-bold ${
                    calculation.stagePercent >= 90 ? "text-[#00C853]" :
                    calculation.stagePercent >= 70 ? "text-[#F5A623]" : "text-[#E53935]"
                  }`}>
                    {calculation.stagePercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-vault-text-faint">
                    {(calculation.stagePercent / 100 * 70).toFixed(2)} / 70 pts
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset */}
        <div className="flex justify-center pt-2">
          <button onClick={reset}
            className="flex items-center gap-2 text-sm text-vault-text-faint border border-vault-border px-4 py-2 rounded-md hover:text-vault-text hover:border-vault-text-muted/50 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset Calculator
          </button>
        </div>
      </div>
    </div>
  );
}
