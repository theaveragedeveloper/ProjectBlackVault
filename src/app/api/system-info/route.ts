import { NextResponse } from "next/server";
import os from "os";
import path from "path";

function isPrivateIPv4(ip: string) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export async function GET() {
  try {
    // Collect local IP addresses (IPv4 only, skip loopback)
    const interfaces = os.networkInterfaces();
    const localIPs = new Set<string>();

    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === "IPv4" && !addr.internal) {
          localIPs.add(addr.address);
        }
      }
    }

    const privateIPs: string[] = [];
    const otherIPs: string[] = [];
    for (const ip of localIPs) {
      if (ip.startsWith("169.254.")) continue; // skip link-local fallback addresses
      if (isPrivateIPv4(ip)) {
        privateIPs.push(ip);
      } else {
        otherIPs.push(ip);
      }
    }
    const orderedLocalIPs = [...privateIPs, ...otherIPs];

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
      localIPs: orderedLocalIPs,
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
