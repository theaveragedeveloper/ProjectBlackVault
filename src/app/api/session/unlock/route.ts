import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  createSessionCookieValue,
  getSessionCookieOptions,
} from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";

    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
      select: { appPassword: true },
    });

    const appPassword = settings?.appPassword ?? null;

    if (!appPassword) {
      return NextResponse.json({ ok: true, passwordRequired: false });
    }

    if (!password || password !== appPassword) {
      return NextResponse.json(
        { ok: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true, passwordRequired: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionCookieValue(appPassword),
      ...getSessionCookieOptions(),
    });

    return response;
  } catch (error) {
    console.error("POST /api/session/unlock error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to unlock session" },
      { status: 500 }
    );
  }
}
