import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getRuntimeConfigValidation } from "@/lib/runtime-config";

export async function GET() {
  const validation = getRuntimeConfigValidation(true);
  let databaseOk = false;
  let databaseError: string | null = null;
  const startupHints: string[] = [];

  if (validation.ok) {
    let prisma: PrismaClient | null = null;
    try {
      prisma = new PrismaClient({ log: ["error"] });
      await prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseError =
        error instanceof Error ? error.message : "Database connectivity check failed.";
    } finally {
      if (prisma) {
        await prisma.$disconnect().catch(() => undefined);
      }
    }
  }

  const ok = validation.ok && databaseOk;
  const statusCode = ok ? 200 : 503;

  if (!validation.ok) {
    startupHints.push("Fix runtime configuration errors and restart the container.");
  }
  if (!databaseOk) {
    startupHints.push("Verify Docker volume permissions and allow migration/startup to finish.");
  }
  if (validation.ok && !databaseOk) {
    startupHints.push("If this is first boot, wait 10-20 seconds and check container logs.");
  }

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      summary: ok ? "All startup checks passed." : "Startup checks failed. Review checks and startupHints.",
      checks: {
        config: {
          ok: validation.ok,
          errors: validation.errors,
          warnings: validation.warnings,
        },
        database: {
          ok: databaseOk,
          error: databaseError,
        },
      },
      startupHints,
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
