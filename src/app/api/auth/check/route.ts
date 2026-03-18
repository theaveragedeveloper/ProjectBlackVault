import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyTokenNode } from "@/lib/session";

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
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      return NextResponse.json(
        {
          passwordRequired,
          authenticated: false,
          error: "Server authentication is not configured. Missing SESSION_SECRET.",
        },
        { status: 503 }
      );
    }
    const authenticated = session?.value
      ? verifyTokenNode(session.value, secret)
      : false;

    return NextResponse.json({ passwordRequired, authenticated });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json(
      { passwordRequired: true, authenticated: false, error: "Auth check failed" },
      { status: 503 }
    );
  }
}
