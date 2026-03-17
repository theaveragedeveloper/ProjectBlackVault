import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const STEP_UP_PASSWORD_HEADER = "x-vault-password";

export async function requireStepUpAuth(request: NextRequest): Promise<NextResponse | null> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true },
  });

  // If no app password is configured, keep behavior backwards compatible.
  if (!settings?.appPassword) {
    return null;
  }

  const providedPassword = request.headers.get(STEP_UP_PASSWORD_HEADER) ?? "";
  if (!providedPassword) {
    return NextResponse.json(
      {
        error: "Step-up authentication required",
        message: "Enter your app password to continue with this sensitive action.",
      },
      { status: 403 }
    );
  }

  if (providedPassword.length > 1024 || !verifyPassword(providedPassword, settings.appPassword)) {
    return NextResponse.json(
      {
        error: "Step-up authentication failed",
        message: "Invalid app password for this operation.",
      },
      { status: 403 }
    );
  }

  return null;
}

export { STEP_UP_PASSWORD_HEADER };
