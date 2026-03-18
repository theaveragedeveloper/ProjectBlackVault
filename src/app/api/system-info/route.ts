import { NextResponse } from "next/server";
import os from "os";
import path from "path";

export async function GET() {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    const exposeSystemInfo = ["1", "true", "yes", "on"].includes(
      (process.env.EXPOSE_SYSTEM_INFO ?? "").trim().toLowerCase()
    );

    if (isProduction && !exposeSystemInfo) {
      return NextResponse.json(
        { error: "System info endpoint is disabled in production." },
        { status: 403 }
      );
    }

    // Collect local IP addresses (IPv4 only, skip loopback)
    const interfaces = os.networkInterfaces();
    const localIPs: string[] = [];

    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === "IPv4" && !addr.internal) {
          localIPs.push(addr.address);
        }
      }
    }

    // Derive the database file path from DATABASE_URL env var
    const dbUrl = process.env.DATABASE_URL ?? "";
    let dbPath = "Not configured";
    if (dbUrl.startsWith("file:")) {
      const relative = dbUrl.replace(/^file:/, "");
      dbPath = path.isAbsolute(relative)
        ? relative
        : path.resolve(process.cwd(), relative);
    }

    const port = process.env.PORT ?? "3000";
    const hostname = os.hostname();

    return NextResponse.json({
      localIPs,
      port,
      hostname,
      dbPath,
      platform: os.platform(),
    });
  } catch (error) {
    console.error("GET /api/system-info error:", error);
    return NextResponse.json({ error: "Failed to get system info" }, { status: 500 });
  }
}
