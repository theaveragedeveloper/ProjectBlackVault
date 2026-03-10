"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import { TrendingUp, Award } from "lucide-react";

interface DrillTemplate {
  id: string;
  name: string;
  category: string;
  scoringType: string;
  parTime: number | null;
  maxScore: number | null;
}

interface DrillResult {
  id: string;
  source: "session" | "drill_log";
  sourceId: string;
  date: string;
  rangeName: string | null;
  buildId: string | null;
  buildName: string | null;
  timeSeconds: number | null;
  score: number | null;
  accuracy: number | null;
  hits: number | null;
  totalShots: number | null;
  notes: string | null;
  isTimePR: boolean;
  isScorePR: boolean;
  isAccuracyPR: boolean;
}

interface BuildStat {
  buildName: string;
  runs: number;
  bestTime: number | null;
  avgTime: number | null;
  bestScore: number | null;
  avgScore: number | null;
  bestAccuracy: number | null;
  avgAccuracy: number | null;
}

interface ResultsData {
  template: DrillTemplate;
  results: DrillResult[];
  stats: {
    runCount: number;
    bestTime: number | null;
    avgTime: number | null;
    bestScore: number | null;
    avgScore: number | null;
    bestAccuracy: number | null;
    avgAccuracy: number | null;
  };
  byBuild: Record<string, BuildStat>;
}

const CATEGORY_LABELS: Record<string, string> = {
  ACCURACY: "Accuracy",
  SPEED: "Speed",
  TACTICAL: "Tactical",
  FUNDAMENTALS: "Fundamentals",
  CUSTOM: "Custom",
};

function fmt(val: number | null, decimals = 2) {
  if (val == null) return "—";
  return val.toFixed(decimals);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

// Custom clickable dot — gold and larger for PR entries
function ClickableDot(props: {
  cx?: number;
  cy?: number;
  payload?: DrillResult;
  onNavigate: (r: DrillResult) => void;
  fill?: string;
  isPRField: "isTimePR" | "isScorePR" | "isAccuracyPR";
}) {
  const { cx, cy, payload, onNavigate, fill, isPRField } = props;
  if (!cx || !cy || !payload) return null;
  const isPR = payload[isPRField];
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isPR ? 7 : 5}
      fill={isPR ? "#F5A623" : (fill ?? "#00C2FF")}
      stroke={isPR ? "#7a4e00" : "#0a1929"}
      strokeWidth={isPR ? 2 : 1.5}
      style={{ cursor: "pointer" }}
      onClick={() => onNavigate(payload)}
    />
  );
}

function DrillPerformanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("templateId") ?? "";

  const [templates, setTemplates] = useState<DrillTemplate[]>([]);
  const [selectedId, setSelectedId] = useState(initialTemplateId);
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/drill-templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d);
        setTemplatesLoading(false);
      })
      .catch(() => setTemplatesLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/drill-templates/${selectedId}/results`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedId]);

  function navigateTo(result: DrillResult) {
    if (result.source === "session") {
      router.push(`/range/${result.sourceId}`);
    } else {
      router.push(`/range/log-drill/${result.sourceId}`);
    }
  }

  const scoringType = data?.template.scoringType ?? "NOTES_ONLY";
  const chartData = (data?.results ?? []).map((r) => ({
    ...r,
    dateLabel: formatDate(r.date),
  }));

  const showTime = scoringType === "TIME" || scoringType === "TIME_AND_SCORE";
  const showScore = scoringType === "SCORE" || scoringType === "TIME_AND_SCORE";
  const showPassFail = scoringType === "PASS_FAIL";
  const showAccuracy = data?.results.some((r) => r.accuracy != null) ?? false;

  const buildEntries = data ? Object.entries(data.byBuild) : [];
  const showByBuild = buildEntries.length >= 2;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-[#00C2FF]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-vault-text tracking-wide">Drill Performance</h1>
          <p className="text-xs text-vault-text-faint">Track progress over time — click any data point to view that entry</p>
        </div>
      </div>

      {/* Drill selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-vault-text-muted whitespace-nowrap">Select Drill</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 bg-vault-bg border border-vault-border rounded-md px-3 py-2 text-sm text-vault-text focus:outline-none focus:border-[#00C2FF]/50"
          disabled={templatesLoading}
        >
          <option value="">— Choose a drill template —</option>
          {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
            const group = templates.filter((t) => t.category === cat);
            if (!group.length) return null;
            return (
              <optgroup key={cat} label={label}>
                {group.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </div>

      {!selectedId && (
        <div className="rounded-lg border border-vault-border bg-vault-surface p-12 text-center text-vault-text-faint text-sm">
          Select a drill template above to view performance history.
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
        </div>
      )}

      {data && !loading && (
        <>
          {/* Stats row — PR chips get gold border + trophy icon */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Runs", value: String(data.stats.runCount), isPR: false },
              ...(showTime
                ? [
                    { label: "Best Time", value: data.stats.bestTime != null ? `${fmt(data.stats.bestTime)}s` : "—", isPR: data.stats.bestTime != null },
                    { label: "Avg Time", value: data.stats.avgTime != null ? `${fmt(data.stats.avgTime)}s` : "—", isPR: false },
                  ]
                : []),
              ...(showScore || showPassFail
                ? [
                    { label: "Best Score", value: data.stats.bestScore != null ? fmt(data.stats.bestScore, 1) : "—", isPR: data.stats.bestScore != null },
                    { label: "Avg Score", value: data.stats.avgScore != null ? fmt(data.stats.avgScore, 1) : "—", isPR: false },
                  ]
                : []),
              ...(showAccuracy
                ? [
                    {
                      label: "Best Accuracy",
                      value: data.stats.bestAccuracy != null ? `${fmt(data.stats.bestAccuracy, 1)}%` : "—",
                      isPR: data.stats.bestAccuracy != null,
                    },
                  ]
                : []),
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-md border bg-vault-surface px-3 py-1.5 text-center ${
                  s.isPR ? "border-[#F5A623]/50" : "border-vault-border"
                }`}
              >
                <p className="text-[10px] text-vault-text-faint uppercase tracking-widest flex items-center justify-center gap-1">
                  {s.isPR && <Award className="w-2.5 h-2.5 text-[#F5A623]" />}
                  {s.label}
                </p>
                <p className={`text-sm font-bold ${s.isPR ? "text-[#F5A623]" : "text-vault-text"}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {data.results.length === 0 && (
            <div className="rounded-lg border border-vault-border bg-vault-surface p-10 text-center text-vault-text-faint text-sm">
              No results yet. Log a session or use{" "}
              <a href="/range/log-drill" className="text-[#00C2FF] hover:underline">
                Log a Drill
              </a>{" "}
              to start tracking.
            </div>
          )}

          {/* Time Chart */}
          {showTime && chartData.some((d) => d.timeSeconds != null) && (
            <div className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-2">
              <p className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest">
                Time (seconds) — lower is better
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#5a7a90", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#5a7a90", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#0d2233", border: "1px solid #1e3a4a", borderRadius: 6 }}
                    labelStyle={{ color: "#8aabb8" }}
                    itemStyle={{ color: "#00C2FF" }}
                    formatter={(v) => [v != null ? `${Number(v)}s` : "—", "Time"]}
                  />
                  {data.template.parTime && (
                    <ReferenceLine
                      y={data.template.parTime}
                      stroke="#F5A623"
                      strokeDasharray="4 4"
                      label={{ value: `par ${data.template.parTime}s`, fill: "#F5A623", fontSize: 10, position: "right" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="timeSeconds"
                    stroke="#00C2FF"
                    strokeWidth={2}
                    dot={(props) => <ClickableDot {...props} onNavigate={navigateTo} fill="#00C2FF" isPRField="isTimePR" />}
                    activeDot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score Chart */}
          {(showScore || showPassFail) && chartData.some((d) => d.score != null) && (
            <div className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-2">
              <p className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest">
                {showPassFail ? "Pass (1) / Fail (0)" : "Score"}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#5a7a90", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "#5a7a90", fontSize: 11 }}
                    domain={showPassFail ? [0, 1] : undefined}
                    tickFormatter={showPassFail ? (v) => (v === 1 ? "Pass" : v === 0 ? "Fail" : "") : undefined}
                  />
                  <Tooltip
                    contentStyle={{ background: "#0d2233", border: "1px solid #1e3a4a", borderRadius: 6 }}
                    labelStyle={{ color: "#8aabb8" }}
                    itemStyle={{ color: "#00C853" }}
                    formatter={(v) => {
                      const n = Number(v);
                      return showPassFail ? [n === 1 ? "Pass" : "Fail", "Result"] : [`${n}`, "Score"];
                    }}
                  />
                  {data.template.maxScore && !showPassFail && (
                    <ReferenceLine
                      y={data.template.maxScore}
                      stroke="#00C853"
                      strokeDasharray="4 4"
                      label={{ value: `max ${data.template.maxScore}`, fill: "#00C853", fontSize: 10, position: "right" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#00C853"
                    strokeWidth={2}
                    dot={(props) => <ClickableDot {...props} onNavigate={navigateTo} fill="#00C853" isPRField="isScorePR" />}
                    activeDot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Accuracy Chart */}
          {showAccuracy && chartData.some((d) => d.accuracy != null) && (
            <div className="rounded-lg border border-vault-border bg-vault-surface p-4 space-y-2">
              <p className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest">Accuracy (%)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a4a" />
                  <XAxis dataKey="dateLabel" tick={{ fill: "#5a7a90", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#5a7a90", fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "#0d2233", border: "1px solid #1e3a4a", borderRadius: 6 }}
                    labelStyle={{ color: "#8aabb8" }}
                    itemStyle={{ color: "#F5A623" }}
                    formatter={(v) => [v != null ? `${Number(v).toFixed(1)}%` : "—", "Accuracy"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#F5A623"
                    strokeWidth={2}
                    dot={(props) => <ClickableDot {...props} onNavigate={navigateTo} fill="#F5A623" isPRField="isAccuracyPR" />}
                    activeDot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* By Build comparison */}
          {showByBuild && (
            <div className="rounded-lg border border-vault-border bg-vault-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-vault-border">
                <p className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest">By Build</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-vault-border text-vault-text-faint">
                      <th className="text-left px-4 py-2 font-normal">Build</th>
                      <th className="text-right px-3 py-2 font-normal">Runs</th>
                      {showTime && <th className="text-right px-3 py-2 font-normal">Best Time</th>}
                      {showTime && <th className="text-right px-3 py-2 font-normal">Avg Time</th>}
                      {(showScore || showPassFail) && <th className="text-right px-3 py-2 font-normal">Best Score</th>}
                      {(showScore || showPassFail) && <th className="text-right px-3 py-2 font-normal">Avg Score</th>}
                      {showAccuracy && <th className="text-right px-3 py-2 font-normal">Best Acc.</th>}
                      {showAccuracy && <th className="text-right px-3 py-2 font-normal">Avg Acc.</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vault-border">
                    {buildEntries.map(([key, b]) => {
                      const bestTimeOverall = showTime ? Math.min(...buildEntries.map(([, x]) => x.bestTime ?? Infinity)) : null;
                      const bestScoreOverall = showScore || showPassFail ? Math.max(...buildEntries.map(([, x]) => x.bestScore ?? -Infinity)) : null;
                      const bestAccOverall = showAccuracy ? Math.max(...buildEntries.map(([, x]) => x.bestAccuracy ?? -Infinity)) : null;
                      return (
                        <tr key={key} className="hover:bg-vault-border/20 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-vault-text">{b.buildName}</td>
                          <td className="px-3 py-2.5 text-right text-vault-text-muted">{b.runs}</td>
                          {showTime && (
                            <td className={`px-3 py-2.5 text-right font-mono ${b.bestTime === bestTimeOverall ? "text-[#00C2FF]" : "text-vault-text"}`}>
                              {b.bestTime != null ? `${b.bestTime.toFixed(2)}s` : "—"}
                            </td>
                          )}
                          {showTime && (
                            <td className="px-3 py-2.5 text-right font-mono text-vault-text-muted">
                              {b.avgTime != null ? `${b.avgTime.toFixed(2)}s` : "—"}
                            </td>
                          )}
                          {(showScore || showPassFail) && (
                            <td className={`px-3 py-2.5 text-right font-mono ${b.bestScore === bestScoreOverall ? "text-[#00C2FF]" : "text-vault-text"}`}>
                              {b.bestScore != null ? (showPassFail ? (b.bestScore === 1 ? "Pass" : "Fail") : fmt(b.bestScore, 1)) : "—"}
                            </td>
                          )}
                          {(showScore || showPassFail) && (
                            <td className="px-3 py-2.5 text-right font-mono text-vault-text-muted">
                              {b.avgScore != null ? fmt(b.avgScore, 1) : "—"}
                            </td>
                          )}
                          {showAccuracy && (
                            <td className={`px-3 py-2.5 text-right font-mono ${b.bestAccuracy === bestAccOverall ? "text-[#00C2FF]" : "text-vault-text"}`}>
                              {b.bestAccuracy != null ? `${b.bestAccuracy.toFixed(1)}%` : "—"}
                            </td>
                          )}
                          {showAccuracy && (
                            <td className="px-3 py-2.5 text-right font-mono text-vault-text-muted">
                              {b.avgAccuracy != null ? `${b.avgAccuracy.toFixed(1)}%` : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results table */}
          {data.results.length > 0 && (
            <div className="rounded-lg border border-vault-border bg-vault-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-vault-border">
                <p className="text-xs font-semibold text-vault-text-faint uppercase tracking-widest">All Entries</p>
              </div>
              <div className="divide-y divide-vault-border">
                {[...data.results].reverse().map((r) => {
                  const isPR = r.isTimePR || r.isScorePR || r.isAccuracyPR;
                  return (
                    <button
                      key={r.id}
                      onClick={() => navigateTo(r)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-vault-border/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm text-vault-text flex items-center gap-1.5">
                          {isPR && <Award className="w-3 h-3 text-[#F5A623] shrink-0" />}
                          {formatDate(r.date)}
                        </p>
                        <p className="text-xs text-vault-text-faint">
                          {r.source === "session" ? "Session" : "Standalone drill"}
                          {r.rangeName ? ` · ${r.rangeName}` : ""}
                          {r.buildName ? ` · ${r.buildName}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-4 text-right">
                        {r.timeSeconds != null && (
                          <span className={`text-sm ${r.isTimePR ? "text-[#F5A623]" : "text-[#00C2FF]"}`}>{r.timeSeconds}s</span>
                        )}
                        {r.score != null && scoringType !== "PASS_FAIL" && (
                          <span className={`text-sm ${r.isScorePR ? "text-[#F5A623]" : "text-[#00C853]"}`}>{r.score}</span>
                        )}
                        {r.score != null && scoringType === "PASS_FAIL" && (
                          <span className={`text-sm ${r.score === 1 ? "text-green-400" : "text-red-400"}`}>
                            {r.score === 1 ? "Pass" : "Fail"}
                          </span>
                        )}
                        {r.accuracy != null && (
                          <span className={`text-sm ${r.isAccuracyPR ? "text-[#F5A623]" : "text-[#F5A623]/70"}`}>{r.accuracy.toFixed(1)}%</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DrillPerformancePage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
      </div>
    }>
      <DrillPerformanceContent />
    </Suspense>
  );
}
