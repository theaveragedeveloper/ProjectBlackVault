import type { NextRequest, NextResponse } from "next/server";

export type WritableEntityType = "firearm" | "accessory" | "ammo" | "build";

export async function requireEntityWriteAccess(
  _request: NextRequest,
  _entityType: WritableEntityType,
  _entityId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  return { ok: true };
}
