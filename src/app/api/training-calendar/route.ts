import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/server/auth";

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

// GET /api/training-calendar?year=2026
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

    // Fetch all sessions and drill logs (all time, for streak calculation)
    const [sessions, drillLogs] = await Promise.all([
      prisma.rangeSession.findMany({
        select: { date: true },
        orderBy: { date: "asc" },
      }),
      prisma.drillLog.findMany({
        select: { performedAt: true },
        orderBy: { performedAt: "asc" },
      }),
    ]);

    // Build a map of dateStr -> { sessionCount, drillCount }
    const allDays = new Map<string, { sessionCount: number; drillCount: number }>();

    for (const s of sessions) {
      const key = toDateStr(new Date(s.date));
      const entry = allDays.get(key) ?? { sessionCount: 0, drillCount: 0 };
      entry.sessionCount++;
      allDays.set(key, entry);
    }

    for (const d of drillLogs) {
      const key = toDateStr(new Date(d.performedAt));
      const entry = allDays.get(key) ?? { sessionCount: 0, drillCount: 0 };
      entry.drillCount++;
      allDays.set(key, entry);
    }

    // Filter days for the requested year
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const yearDays = Array.from(allDays.entries())
      .filter(([date]) => date >= yearStart && date <= yearEnd)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Compute streaks using all-time data
    const allActiveDates = Array.from(allDays.keys()).sort();
    const today = toDateStr(new Date());

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let prevDate: string | null = null;

    for (const dateStr of allActiveDates) {
      if (prevDate === null) {
        streak = 1;
      } else {
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
        if (diffDays === 1) {
          streak++;
        } else {
          streak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
      prevDate = dateStr;
    }

    // Current streak: count consecutive days ending today (or yesterday)
    const yesterday = toDateStr(new Date(Date.now() - 86400000));
    const lastActive = allActiveDates[allActiveDates.length - 1] ?? null;
    if (lastActive === today || lastActive === yesterday) {
      currentStreak = streak; // streak at last active date
    } else {
      currentStreak = 0;
    }

    // Stats for the requested year
    const totalActiveDays = yearDays.length;
    const totalSessions = yearDays.reduce((s, d) => s + d.sessionCount, 0);
    const totalDrills = yearDays.reduce((s, d) => s + d.drillCount, 0);

    // Avg sessions per week: divide by 52 (or actual weeks elapsed if current year)
    let weeksInYear = 52;
    if (year === new Date().getFullYear()) {
      const dayOfYear = Math.ceil((new Date().getTime() - new Date(`${year}-01-01`).getTime()) / 86400000);
      weeksInYear = Math.max(1, dayOfYear / 7);
    }
    const avgSessionsPerWeek = Math.round((totalSessions / weeksInYear) * 10) / 10;

    return NextResponse.json({
      year,
      days: yearDays,
      currentStreak,
      longestStreak,
      totalActiveDays,
      totalSessions,
      totalDrills,
      avgSessionsPerWeek,
    });
  } catch (error) {
    console.error("GET /api/training-calendar error:", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }
}
