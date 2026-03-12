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
import { Calculator, Target } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export default function DopeCardPage() {
  const [startYd, setStartYd] = useState("100");
  const [endYd, setEndYd] = useState("800");
  const [stepYd, setStepYd] = useState("100");

  const [dropPer100YdIn, setDropPer100YdIn] = useState("3.5");
  const [windPer100YdIn, setWindPer100YdIn] = useState("1.2");

  const [rows, setRows] = useState<AngularDopeRow[]>([]);
  const [corrections, setCorrections] = useState<Record<number, DopeRowCorrection>>({});

  const estimateSummary = useMemo(() => {
    if (!rows.length) return null;
    const confirmedCount = rows.filter((r) => r.confirmed).length;
    return `${confirmedCount}/${rows.length} rows confirmed from impacts`;
  }, [rows]);

  function handleGenerate() {
    const start = Number(startYd);
    const end = Number(endYd);
    const step = Number(stepYd);
    const dropRate = Number(dropPer100YdIn);
    const windRate = Number(windPer100YdIn);

    const distanceRows = generateDistanceRows(start, end, step);
    const estimatedRows = distanceRows.map(({ distanceYd }) => ({
      distanceYd,
      dropIn: Number(((distanceYd / 100) * dropRate).toFixed(2)),
      windIn: Number(((distanceYd / 100) * windRate).toFixed(2)),
    }));

    const converted = convertDropWindToAngular(estimatedRows);
    setCorrections({});
    setRows(converted);
  }

  function updateCorrection(distanceYd: number, patch: DopeRowCorrection) {
    const nextCorrections = {
      ...corrections,
      [distanceYd]: {
        ...corrections[distanceYd],
        ...patch,
      },
    };
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
        <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg p-4">
          <p className="text-sm text-[#F5A623] font-medium">
            Estimate only: this builder is a starting point and is not a replacement for verified firing data.
          </p>
        </div>

        <section className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-xs uppercase tracking-widest text-[#00C2FF] font-mono">Auto-Populate Estimates</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
              <label className={LABEL_CLASS}>Est. Drop / 100yd (in)</label>
              <input value={dropPer100YdIn} onChange={(e) => setDropPer100YdIn(e.target.value)} type="number" step="0.1" className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Est. Wind / 100yd (in)</label>
              <input value={windPer100YdIn} onChange={(e) => setWindPer100YdIn(e.target.value)} type="number" step="0.1" className={INPUT_CLASS} />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors"
          >
            Generate Estimated Rows
          </button>
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
                        value={corrections[row.distanceYd]?.dropIn ?? row.dropIn}
                        onChange={(e) => updateCorrection(row.distanceYd, { dropIn: Number(e.target.value) })}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono">{row.dropMil.toFixed(2)}</td>
                    <td className="px-3 py-2 font-mono">{row.dropMoa.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
                        className={`${INPUT_CLASS} min-w-[110px]`}
                        value={corrections[row.distanceYd]?.windIn ?? row.windIn}
                        onChange={(e) => updateCorrection(row.distanceYd, { windIn: Number(e.target.value) })}
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
