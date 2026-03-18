"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { Target, MapPin, Calendar, Loader2, ChevronDown, Clock, BarChart2, ListIcon, DollarSign, CalendarDays } from "lucide-react";
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

interface RangeSessionFirearm {
  id: string;
  firearmId: string;
  roundsFired: number;
  firearm: { id: string; name: string; caliber: string };
  build: { id: string; name: string } | null;
}

interface RangeSession {
  id: string;
  date: string;
  roundsFired: number;
  rangeName: string | null;
  rangeLocation: string | null;
  notes: string | null;
  groupSizeIn: number | null;
  groupSizeMoa: number | null;
  targetDistanceYd: number | null;
  sessionFirearms: RangeSessionFirearm[];
  _count: { sessionDrills: number };
  sessionDrills?: { accuracy: number | null; drillName: string; templateId: string | null; timeSeconds: number | null; score: number | null }[];
}

interface AmmoCostData {
  monthlyPurchases: { month: string; amount: number; rounds: number }[];
  inventoryValue: number;
  costPerRound: { caliber: string; avgCostPerRound: number }[];
  allTimeSpend: number;
}

interface CalendarDay {
  date: string;
  sessionCount: number;
  drillCount: number;
}

interface CalendarData {
  year: number;
  days: CalendarDay[];
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalSessions: number;
  totalDrills: number;
  avgSessionsPerWeek: number;
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

// Build 52-week calendar grid from days data
function buildCalendarGrid(days: CalendarDay[], year: number) {
  const dayMap = new Map(days.map((d) => [d.date, d]));

  // Start from Monday of the first week that contains Jan 1 of the year
  const jan1 = new Date(year, 0, 1);
  // Go back to Monday
  const startDay = new Date(jan1);
  const dayOfWeek = (jan1.getDay() + 6) % 7; // Mon=0
  startDay.setDate(jan1.getDate() - dayOfWeek);

  const weeks: { date: string; count: number; isCurrentYear: boolean }[][] = [];
  const current = new Date(startDay);

  for (let w = 0; w < 53; w++) {
    const week: { date: string; count: number; isCurrentYear: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = current.toISOString().split("T")[0];
      const entry = dayMap.get(iso);
      week.push({
        date: iso,
        count: entry ? entry.sessionCount + entry.drillCount : 0,
        isCurrentYear: current.getFullYear() === year,
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
    if (current.getFullYear() > year && current.getMonth() > 0) break;
  }

  return weeks;
}

function cellColor(count: number, isCurrentYear: boolean) {
  if (!isCurrentYear) return "bg-transparent";
  if (count === 0) return "bg-vault-border/60";
  if (count === 1) return "bg-[#00C2FF]/35";
  if (count === 2) return "bg-[#00C2FF]/65";
  return "bg-[#00C2FF]";
}

export default function RangeHistoryPage() {
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [firearmFilter, setFirearmFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState("history");

  // Cost tab state (lazy load)
  const [costData, setCostData] = useState<AmmoCostData | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costLoaded, setCostLoaded] = useState(false);

  // Calendar tab state (lazy load)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const uniqueFirearms = useMemo(
    () => Array.from(new Map(sessions.flatMap((s) => s.sessionFirearms.map((sf) => [sf.firearm.id, sf.firearm]))).values()),
    [sessions]
  );

  const filtered = useMemo(
    () => firearmFilter === "ALL" ? sessions : sessions.filter((s) => s.sessionFirearms.some((sf) => sf.firearm.id === firearmFilter)),
    [sessions, firearmFilter]
  );

  const totalRounds = useMemo(() => filtered.reduce((sum, s) => sum + s.roundsFired, 0), [filtered]);

  useEffect(() => {
    fetch("/api/range-sessions?include=analytics")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Lazy load cost data when tab is first activated
  useEffect(() => {
    if (activeTab !== "cost" || costLoaded) return;

    const timer = setTimeout(() => {
      setCostLoading(true);
      setCostLoaded(true);
      fetch("/api/analytics/ammo-cost")
        .then((r) => r.json())
        .then((d) => { setCostData(d); setCostLoading(false); })
        .catch(() => setCostLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, costLoaded]);

  // Lazy load calendar data when tab is first activated or year changes
  useEffect(() => {
    if (activeTab !== "calendar") return;

    const timer = setTimeout(() => {
      setCalendarLoading(true);
      fetch(`/api/training-calendar?year=${calendarYear}`)
        .then((r) => r.json())
        .then((d) => { setCalendarData(d); setCalendarLoading(false); })
        .catch(() => setCalendarLoading(false));
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, calendarYear]);

  // ── Analytics aggregations ───────────────────────────────────────
  const roundsByMonth = useMemo(() => {
    const map = new Map<string, { rounds: number; sessions: number }>();
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
        firearm: s.sessionFirearms.map((sf) => sf.firearm.name).join(", "),
      }));
  }, [filtered]);

  const personalBestGroup = useMemo(() => {
    if (groupTrend.length === 0) return null;
    return Math.min(...groupTrend.map((g) => g.groupSizeIn));
  }, [groupTrend]);

  const avgRoundsPerSession = filtered.length > 0
    ? Math.round(totalRounds / filtered.length)
    : 0;

  const calendarGrid = useMemo(
    () => calendarData ? buildCalendarGrid(calendarData.days, calendarYear) : [],
    [calendarData, calendarYear]
  );

  // Month labels for calendar
  const calendarMonths = useMemo(() => {
    if (!calendarGrid.length) return [];
    const labels: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    calendarGrid.forEach((week, wi) => {
      const firstDay = week.find((d) => d.isCurrentYear);
      if (!firstDay) return;
      const month = new Date(firstDay.date).getMonth();
      if (month !== lastMonth) {
        labels.push({ label: new Date(firstDay.date).toLocaleDateString("en-US", { month: "short" }), weekIndex: wi });
        lastMonth = month;
      }
    });
    return labels;
  }, [calendarGrid]);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="min-h-full">
      <PageHeader
        title="Range History"
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
            <p className="text-xs text-vault-text-faint mb-0.5">Total sessions</p>
            <p className="text-lg font-bold font-mono text-vault-text">{sessions.length}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-xs text-vault-text-faint mb-0.5">Rounds fired</p>
            <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(totalRounds)}</p>
          </div>
          {avgRoundsPerSession > 0 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-xs text-vault-text-faint mb-0.5">Avg / session</p>
                <p className="text-lg font-bold font-mono text-vault-text">{formatNumber(avgRoundsPerSession)}</p>
              </div>
            </>
          )}
          {uniqueFirearms.length > 1 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-xs text-vault-text-faint mb-0.5">Platforms</p>
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

        {/* Tabs */}
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex gap-1 mb-5 bg-vault-surface border border-vault-border rounded-lg p-1 w-fit flex-wrap">
            <Tabs.Trigger value="history"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <ListIcon className="w-3.5 h-3.5" /> History
            </Tabs.Trigger>
            <Tabs.Trigger value="analytics"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </Tabs.Trigger>
            <Tabs.Trigger value="cost"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <DollarSign className="w-3.5 h-3.5" /> Cost
            </Tabs.Trigger>
            <Tabs.Trigger value="calendar"
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-[#00C2FF]/10 data-[state=active]:text-[#00C2FF] data-[state=inactive]:text-vault-text-muted hover:text-vault-text">
              <CalendarDays className="w-3.5 h-3.5" /> Calendar
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
              <div className="space-y-3">
                {filtered.map((session) => (
                  <Link key={session.id} href={`/range/${session.id}`}
                    className="block bg-vault-surface border border-vault-border rounded-lg p-4 hover:border-[#00C2FF]/30 hover:bg-[#00C2FF]/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="text-sm font-semibold text-vault-text">{session.sessionFirearms.map((sf) => sf.firearm.name).join(", ")}</span>
                          {session.sessionFirearms.some((sf) => sf.build) && (
                            <span className="text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                              {session.sessionFirearms.filter((sf) => sf.build).map((sf) => sf.build!.name).join(", ")}
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
                <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-vault-text-muted mb-4">
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

                <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-vault-text-muted mb-4">
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

                {groupTrend.length >= 2 && (
                  <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                    <p className="text-sm font-semibold text-vault-text-muted mb-4">
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

          {/* COST TAB */}
          <Tabs.Content value="cost">
            {costLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              </div>
            ) : !costData ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <DollarSign className="w-10 h-10 text-vault-text-faint mx-auto mb-3" />
                <p className="text-vault-text-muted">No ammo cost data available yet.</p>
                <p className="text-xs text-vault-text-faint mt-1">Add ammo stocks with a purchase price to track spending.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary chips */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "All-Time Spend", value: formatCurrency(costData.allTimeSpend), color: "text-[#E53935]" },
                    { label: "Inventory Value", value: formatCurrency(costData.inventoryValue), color: "text-[#00C853]" },
                    ...(costData.costPerRound.length > 0
                      ? [{
                          label: "Avg Cost/Round",
                          value: `$${(costData.costPerRound.reduce((s, c) => s + c.avgCostPerRound, 0) / costData.costPerRound.length).toFixed(3)}`,
                          color: "text-[#F5A623]",
                        }]
                      : []),
                  ].map((chip) => (
                    <div key={chip.label} className="rounded-md border border-vault-border bg-vault-surface px-4 py-2 text-center">
                      <p className="text-xs text-vault-text-faint">{chip.label}</p>
                      <p className={`text-base font-bold font-mono ${chip.color}`}>{chip.value}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly spend chart */}
                {costData.monthlyPurchases.some((m) => m.amount > 0) && (
                  <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
                    <p className="text-sm font-semibold text-vault-text-muted mb-4">
                      Monthly Ammo Spend — Last 12 Months
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={costData.monthlyPurchases}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="month" tick={CHART_STYLE.tickStyle} />
                        <YAxis tick={CHART_STYLE.tickStyle} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={CHART_STYLE.contentStyle}
                          formatter={(v: unknown) => [`$${Number(v).toFixed(2)}`, "Spend"]}
                        />
                        <Bar dataKey="amount" fill="#E53935" fillOpacity={0.7} name="Spend" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Cost per round by caliber */}
                {costData.costPerRound.length > 0 && (
                  <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-vault-border">
                      <p className="text-sm font-semibold text-vault-text-faint">Cost Per Round by Caliber</p>
                    </div>
                    <div className="divide-y divide-vault-border">
                      {costData.costPerRound.map((c) => (
                        <div key={c.caliber} className="flex items-center justify-between px-4 py-3">
                          <span className="text-sm text-vault-text font-mono">{c.caliber}</span>
                          <span className="text-sm font-bold text-[#F5A623] font-mono">
                            ${c.avgCostPerRound.toFixed(3)} / rd
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Tabs.Content>

          {/* CALENDAR TAB */}
          <Tabs.Content value="calendar">
            {/* Year selector */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs text-vault-text-muted">Year</span>
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => setCalendarYear(y)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-colors ${
                    calendarYear === y
                      ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                      : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {calendarLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              </div>
            ) : !calendarData ? null : (
              <div className="space-y-6">
                {/* Streak stats */}
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Current Streak", value: `${calendarData.currentStreak}d`, color: calendarData.currentStreak > 0 ? "text-[#00C2FF]" : "text-vault-text" },
                    { label: "Longest Streak", value: `${calendarData.longestStreak}d`, color: "text-[#F5A623]" },
                    { label: "Active Days", value: String(calendarData.totalActiveDays), color: "text-vault-text" },
                    { label: "Avg / Week", value: String(calendarData.avgSessionsPerWeek), color: "text-vault-text" },
                  ].map((chip) => (
                    <div key={chip.label} className="rounded-md border border-vault-border bg-vault-surface px-4 py-2 text-center">
                      <p className="text-xs text-vault-text-faint">{chip.label}</p>
                      <p className={`text-base font-bold font-mono ${chip.color}`}>{chip.value}</p>
                    </div>
                  ))}
                </div>

                {/* Calendar heatmap */}
                <div className="bg-vault-surface border border-vault-border rounded-lg p-4 overflow-x-auto">
                  <p className="text-sm font-semibold text-vault-text-muted mb-3">
                    Training Activity — {calendarYear}
                  </p>

                  {/* Month labels */}
                  <div className="flex mb-1" style={{ gap: "3px" }}>
                    {calendarGrid.map((_, wi) => {
                      const label = calendarMonths.find((m) => m.weekIndex === wi);
                      return (
                        <div key={wi} className="w-3 shrink-0 text-[9px] text-vault-text-faint text-center" style={{ minWidth: "12px" }}>
                          {label ? label.label : ""}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid: 7 rows (Mon–Sun), N columns (weeks) */}
                  <div className="flex flex-col" style={{ gap: "3px" }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                      <div key={dayOfWeek} className="flex" style={{ gap: "3px" }}>
                        {calendarGrid.map((week, wi) => {
                          const cell = week[dayOfWeek];
                          if (!cell) return <div key={wi} className="w-3 h-3 shrink-0" style={{ minWidth: "12px" }} />;
                          return (
                            <div
                              key={wi}
                              title={`${cell.date}${cell.count > 0 ? ` · ${cell.count} activit${cell.count === 1 ? "y" : "ies"}` : ""}`}
                              className={`w-3 h-3 rounded-sm shrink-0 transition-opacity hover:opacity-80 ${cellColor(cell.count, cell.isCurrentYear)}`}
                              style={{ minWidth: "12px" }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[9px] text-vault-text-faint">Less</span>
                    {["bg-vault-border/60", "bg-[#00C2FF]/35", "bg-[#00C2FF]/65", "bg-[#00C2FF]"].map((cls) => (
                      <div key={cls} className={`w-3 h-3 rounded-sm ${cls}`} />
                    ))}
                    <span className="text-[9px] text-vault-text-faint">More</span>
                  </div>
                </div>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
