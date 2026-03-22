import type { NextResponse } from "next/server";

// Auth is intentionally stubbed for now; always allow.
export async function requireAuth(): Promise<NextResponse | null> {
  return null;
}
