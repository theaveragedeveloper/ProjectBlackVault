import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton" } });
    }

    // If no password is set, always allow access
    if (!settings.appPassword) {
      const token = crypto.randomBytes(32).toString("hex");
      const cookieStore = await cookies();
      cookieStore.set("vault_session", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return NextResponse.json({ success: true });
    }

    // Validate password
    if (password !== settings.appPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const cookieStore = await cookies();
    cookieStore.set("vault_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
