import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyTokenNode } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";

export async function GET() {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton" } });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("vault_session");
    const passwordRequired = !!settings.appPassword;
    const secret = getSessionSecret();
    const authenticated = session?.value
      ? (secret ? verifyTokenNode(session.value, secret) : false)
      : false;

    return NextResponse.json({ passwordRequired, authenticated });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json({ passwordRequired: false, authenticated: false });
  }
}
