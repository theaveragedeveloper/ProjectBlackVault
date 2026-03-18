import { NextResponse } from "next/server";
import { isPasswordSet } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function GET() {
  try {
    const [passwordSet, session] = await Promise.all([
      isPasswordSet(),
      getSession(),
    ]);

    return NextResponse.json({
      authenticated: session.authenticated === true,
      passwordSet,
    });
  } catch (error) {
    console.error("GET /api/auth/status error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
