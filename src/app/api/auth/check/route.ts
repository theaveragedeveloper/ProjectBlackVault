import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionSecret, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton" } });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    const passwordRequired = !!settings.appPassword;
    const requiresSetup = !settings.appPassword;
    const secret = getSessionSecret();
    const authenticated = session?.value && secret
      ? verifyTokenNode(session.value, secret)
      : false;

    return NextResponse.json(
      { passwordRequired, requiresSetup, authenticated },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    console.error("GET /api/auth/check failed");
    return NextResponse.json(
      { passwordRequired: false, requiresSetup: false, authenticated: false },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
