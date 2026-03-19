import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getSessionSecret, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";

export async function GET() {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {},
    });

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
  } catch (error) {
    console.error("GET /api/auth/check failed", error);
    return NextResponse.json(
      { error: "Unable to verify authentication state." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
