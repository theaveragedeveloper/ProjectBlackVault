import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/dashboard/get-dashboard-stats";

// GET /api/stats - Dashboard stats
// Returns: total firearms, total accessories, total ammo by caliber,
//          total investment value, recent items
export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
