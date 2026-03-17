import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSessionVersion, verifyTokenNode } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";

export type WritableEntityType = "firearm" | "accessory" | "build";

type AccessResult =
  | { ok: true }
  | { ok: false; response: NextResponse };

async function requireAuthenticatedVaultSession(request: NextRequest): Promise<AccessResult> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true, sessionVersion: true },
  });

  // Backwards compatible behavior: no app password means no session requirement.
  if (!settings?.appPassword) {
    return { ok: true };
  }

  const sessionCookie = request.cookies.get("vault_session")?.value;
  if (!sessionCookie) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const sessionSecret = getSessionSecret();
  if (!verifyTokenNode(sessionCookie, sessionSecret)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  const cookieVersion = extractSessionVersion(sessionCookie);
  const expectedVersion = settings.sessionVersion || 1;
  if (cookieVersion === null || cookieVersion !== expectedVersion) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true };
}

export async function requireEntityWriteAccess(
  request: NextRequest,
  entityType: WritableEntityType,
  entityId: string
): Promise<AccessResult> {
  const sessionCheck = await requireAuthenticatedVaultSession(request);
  if (!sessionCheck.ok) {
    return sessionCheck;
  }

  switch (entityType) {
    case "firearm": {
      const firearm = await prisma.firearm.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!firearm) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Firearm not found" }, { status: 404 }),
        };
      }

      return { ok: true };
    }
    case "accessory": {
      const accessory = await prisma.accessory.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!accessory) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Accessory not found" }, { status: 404 }),
        };
      }

      return { ok: true };
    }
    case "build": {
      const build = await prisma.build.findUnique({
        where: { id: entityId },
        select: { id: true },
      });

      if (!build) {
        return {
          ok: false,
          response: NextResponse.json({ error: "Build not found" }, { status: 404 }),
        };
      }

      return { ok: true };
    }
  }
}
