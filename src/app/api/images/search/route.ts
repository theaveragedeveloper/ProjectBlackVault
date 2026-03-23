import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server/auth";

// POST /api/images/search - deprecated/disabled
export async function POST() {
  const auth = await requireAuth();
  if (auth) return auth;

  return NextResponse.json(
    {
      error: "Image search has been disabled. Use direct image upload instead.",
      disabled: true,
    },
    { status: 410 }
  );
}
