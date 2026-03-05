"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber } from "@/lib/utils";
import { Target, MapPin, Calendar, Loader2, ChevronDown, Clock, BarChart2, ListIcon } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
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
} from "recharts";

interface RangeSession {
  id: string;
  firearmId: string;
  buildId: string | null;
  date: string;
  roundsFired: number;
  rangeName: string | null;
  rangeLocation: string | null;
  notes: string | null;
  groupSizeIn: number | null;
  groupSizeMoa: number | null;
  targetDistanceYd: number | null;
  firearm: { id: string; name: string; caliber: string };
  build: { id: string; name: string } | null;
  _count: { sessionDrills: number };
  sessionDrills?: { accuracy: number | null; drillName: string; templateId: string | null; timeSeconds: number | null; score: number | null }[];
}

function formatSessionDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

const CHART_STYLE = {
  contentStyle: {
    background: "hsl(var(--vault-surface, 220 14% 12%))",
    border: "1px solid hsl(var(--vault-border, 220 13% 22%))",
    borderRadius: 6,
    fontSize: 11,
  },
  tickStyle: { fill: "#6b7280", fontSize: 10 },
};

export default function RangeHistoryPage() {
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [firearmFilter, setFirearmFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("history");

  const uniqueFirearms = useMemo(
    () => Array.from(new Map(sessions.map((s) => [s.firearm.id, s.firearm])).values()),
    [sessions]
  );

  const filtered = useMemo(
    () => firearmFilter === "ALL" ? sessions : sessions.filter((s) => s.firearm.id === firearmFilter),
    [sessions, firearmFilter]
  );

  const totalRounds = useMemo(() => filtered.reduce((sum, s) => sum + s.roundsFired, 0), [filtered]);

  useEffect(() => {
    fetch("/api/range-sessions?include=analytics")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Analytics aggregations ───────────────────────────────────────
  const roundsByMonth = useMemo(() => {
    const map = new Map<string, { rounds: number; sessions: number }>();
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      map.set(getMonthKey(d.toISOString()), { rounds: 0, sessions: 0 });
    }
    for (const s of filtered) {
      const key = getMonthKey(s.date);
      if (map.has(key)) {
        map.get(key)!.rounds += s.roundsFired;
        map.get(key)!.sessions += 1;
      }
    }
    return Array.from(map.entries()).map(([key, val]) => ({
      month: getMonthLabel(key),
      rounds: val.rounds,
      sessions: val.sessions,
    }));
  }, [filtered]);

  const groupTrend = useMemo(() => {
    return filtered
      .filter((s) => s.groupSizeIn != null && s.targetDistanceYd != null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((s) => ({
        date: formatSessionDate(s.date),
        groupSizeIn: s.groupSizeIn!,
        distanceYd: s.targetDistanceYd!,
        firearm: s.firearm.name,
      }));
  }, [filtered]);

  const personalBestGroup = useMemo(() => {
    if (groupTrend.length === 0) return null;
    return Math.min(...groupTrend.map((g) => g.groupSizeIn));
  }, [groupTrend]);

  const avgRoundsPerSession = filtered.length > 0
    ? Math.round(totalRounds / filtered.length)
    : 0;

  return (
    <div className="min-h-full">
      <PageHeader
        title="RANGE HISTORY"
        subtitle={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} logged`}
        actions={
          <Link href="/range"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors">
            <Target className="w-4 h-4" />
            Log Session
          </Link>
        }
      />

      <div className="p-6">
        {/* Summary strip */}
        <div className="flex items-center gap-6 mb-6 bg-vault-surface border border-vault-border rounded-lg px-5 py-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Total Sessions</p>
            <p className="text-lg font-bold font-mono text-vault-text">{sessions.length}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Rounds Fired</p>
            <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(totalRounds)}</p>
          </div>
          {avgRoundsPerSession > 0 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Avg / Session</p>
                <p className="text-lg font-bold font-mono text-vault-text">{formatNumber(avgRoundsPerSession)}</p>
              </div>
            </>
          )}
          {uniqueFirearms.length > 1 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Platforms</p>
                <p className="text-lg font-bold font-mono text-vault-text">{uniqueFirearms.length}</p>
              </div>
            </>
          )}
        </div>

        {/* Firearm filter */}
        {uniqueFirearms.length > 1 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <button onClick={() => setFirearmFilter("ALL")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                firearmFilter === "ALL"
                  ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                  : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
              }`}>
              All Firearms
            </button>
            {uniqueFirearms.map((f) => (
              <button key={f.id} onClick={() => setFirearmFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                  firearmFilter === f.id
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
                }`}>
                {f.name}
              </button>
            ))}
          </div>
        )}

        {/* History / Analytics tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 mb-5 bg-vault-surface border border-vault-border rounded-lg p-1 w-fit">
            <Tabs.Trigger value="history"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <ListIcon className="w-3.5 h-3.5" /> History
            </Tabs.Trigger>
            <Tabs.Trigger value="analytics"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </Tabs.Trigger>
          </Tabs.List>

          {/* HISTORY TAB */}
          <Tabs.Content value="history">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-[#00C2FF]" />
                </div>
                <h3 className="text-lg font-semibold text-vault-text mb-2">No range sessions yet</h3>
                <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
                  Log your first range session to start tracking your shooting history.
                </p>
                <Link href="/range"
                  className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors">
                  <Target className="w-4 h-4" />
                  Log First Session
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {filtered.map((session) => (
                    <Link key={session.id} href={`/range/${session.id}`}
                      className="block bg-vault-surface border border-vault-border rounded-lg p-4 hover:border-[#00C2FF]/30 hover:bg-[#00C2FF]/5 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="text-sm font-semibold text-vault-text">{session.firearm.name}</span>
                            {session.build && (
                              <span className="text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                                {session.build.name}
                              </span>
                            )}
                            <span className="text-[10px] font-mono font-bold text-[#00C2FF] bg-[#00C2FF]/10 border border-[#00C2FF]/20 px-2 py-0.5 rounded">
                              {formatNumber(session.roundsFired)} rds
                            </span>
                            {session._count.sessionDrills > 0 && (
                              <span className="text-[10px] font-mono text-[#F5A623] border border-[#F5A623]/20 px-1.5 py-0.5 rounded">
                                {session._count.sessionDrills} drill{session._count.sessionDrills !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-vault-text-faint flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatSessionDate(session.date)}</span>
                            </div>
                            {session.rangeName && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{session.rangeName}{session.rangeLocation ? ` · ${session.rangeLocation}` : ""}</span>
                              </div>
                            )}
                            {session.groupSizeIn != null && (
                              <span className="text-[10px] font-mono text-[#00C853]">
                                {session.groupSizeIn}&quot; group
                              </span>
                            )}
                          </div>

                          {session.notes && (
                            <p className="text-xs text-vault-text-muted mt-2 line-clamp-2">{session.notes}</p>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-vault-text-faint shrink-0 -rotate-90" />
                      </div>
                    </Link>
                  ))}
                </div>

                {filtered.length > 5 && (
                  <div className="flex justify-center mt-6">
                    <ChevronDown className="w-4 h-4 text-vault-text-faint" />
                  </div>
                )}
              </>
            )}
          </Tabs.Content>

          {/* ANALYTICS TAB */}
          <Tabs.Content value="analytics">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <BarChart2 className="w-10 h-10 text-vault-text-faint mx-auto mb-3" />
                <p className="text-vault-text-muted">Log sessions to see analytics.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Rounds over time */}
                <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-vault-text-muted mb-4">
                    Rounds Fired — Last 12 Months
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={roundsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={CHART_STYLE.tickStyle} />
                      <YAxis tick={CHART_STYLE.tickStyle} />
                      <Tooltip contentStyle={CHART_STYLE.contentStyle} />
                      <Line type="monotone" dataKey="rounds" stroke="#00C2FF" strokeWidth={2} dot={false} name="Rounds" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Sessions per month */}
                <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-vault-text-muted mb-4">
                    Sessions Per Month
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={roundsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" tick={CHART_STYLE.tickStyle} />
                      <YAxis allowDecimals={false} tick={CHART_STYLE.tickStyle} />
                      <Tooltip contentStyle={CHART_STYLE.contentStyle} />
                      <Bar dataKey="sessions" fill="#00C2FF" fillOpacity={0.7} name="Sessions" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Group size trend */}
                {groupTrend.length >= 2 && (
                  <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                    <p className="text-xs font-mono uppercase tracking-widest text-vault-text-muted mb-4">
                      Best Group Size Trend (inches)
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={groupTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={CHART_STYLE.tickStyle} />
                        <YAxis tick={CHART_STYLE.tickStyle} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={CHART_STYLE.contentStyle}
                          formatter={(v: unknown) => [`${v}"`, "Group"]} />
                        {personalBestGroup != null && (
                          <ReferenceLine y={personalBestGroup} stroke="#00C853" strokeDasharray="4 2"
                            label={{ value: "PB", fill: "#00C853", fontSize: 10 }} />
                        )}
                        <Line type="monotone" dataKey="groupSizeIn" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} name="Group (in)" />
                      </LineChart>
                    </ResponsiveContainer>
                    {personalBestGroup != null && (
                      <p className="text-xs text-vault-text-faint mt-1">
                        Personal best: <span className="text-[#00C853] font-mono">{personalBestGroup}&quot;</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
