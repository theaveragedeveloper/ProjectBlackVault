import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieOptions } from "@/lib/session-config";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("vault_session", "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}
