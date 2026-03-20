import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isPasswordSet } from "@/lib/auth";
import { extractSessionVersion, verifyTokenNode } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [passwordSet, settings, cookieStore] = await Promise.all([
      isPasswordSet(),
      prisma.appSettings.findUnique({ where: { id: "singleton" }, select: { sessionVersion: true } }),
      cookies(),
    ]);

    const session = cookieStore.get("vault_session");
    let authenticated = false;
    try {
      const secret = getSessionSecret();
      if (session?.value && secret) {
        const valid = verifyTokenNode(session.value, secret);
        const version = extractSessionVersion(session.value);
        authenticated = valid && version !== null && version === (settings?.sessionVersion ?? 1);
      }
    } catch {
      authenticated = false;
    }

    return NextResponse.json({ authenticated, passwordSet });
  } catch (error) {
    console.error("GET /api/auth/status error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
