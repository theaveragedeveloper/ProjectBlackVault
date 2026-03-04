import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

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
    const authenticated = !!session?.value;

    return NextResponse.json({ passwordRequired, authenticated });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json({ passwordRequired: false, authenticated: true });
  }
}
