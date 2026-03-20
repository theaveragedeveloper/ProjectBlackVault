import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractSessionVersion, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton", sessionVersion: 1 } });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("vault_session");
    const passwordRequired = !!settings.appPassword;
    const secret = getSessionSecret();
    const authenticated = session?.value && secret
      ? (() => {
          if (!verifyTokenNode(session.value, secret)) return false;
          const sessionVersion = extractSessionVersion(session.value);
          return sessionVersion !== null && sessionVersion === (settings.sessionVersion || 1);
        })()
      : false;

    return NextResponse.json({ passwordRequired, authenticated, requiresSetup: !passwordRequired });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json({ passwordRequired: false, authenticated: false, requiresSetup: true });
  }
}
