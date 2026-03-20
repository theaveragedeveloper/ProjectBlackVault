import { NextResponse } from "next/server";
import os from "os";
import path from "path";
import {
  allowExternalImageUrls,
  allowImageSearchEgress,
  allowReleaseLookup,
  requirePrivateNetworkForUpdates,
} from "@/lib/network-policy";
import { requireAuth } from "@/lib/server/auth";

function resolveCanonicalUrl(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    parsed.search = "";

    const normalized = parsed.toString();
    return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
  } catch {
    return null;
  }
}

function isPrivateIPv4(ip: string) {
  return (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  );
}

export async function GET() {
  const auth = await requireAuth();
  if (auth) return auth;

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
    const localIPs = new Set<string>();

    for (const iface of Object.values(interfaces)) {
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === "IPv4" && !addr.internal) {
          localIPs.add(addr.address);
        }
      }
    }

    // Derive the database filename from DATABASE_URL env var.
    // Only expose the filename (not the full path) to avoid leaking filesystem layout.
    const dbUrl = process.env.DATABASE_URL ?? "";
    let dbPath = "Not configured";
    if (dbUrl.startsWith("file:")) {
      const relative = dbUrl.replace(/^file:/, "");
      dbPath = path.basename(relative);
    }

    const port = process.env.PORT ?? "3000";
    const hostname = os.hostname();
    const canonicalUrl = resolveCanonicalUrl(process.env.APP_BASE_URL);

    return NextResponse.json({
      localIPs: orderedLocalIPs,
      port,
      hostname,
      dbPath,
      platform: os.platform(),
      canonicalUrl,
      networkPolicy: {
        allowReleaseLookup: allowReleaseLookup(),
        allowImageSearchEgress: allowImageSearchEgress(),
        allowExternalImageUrls: allowExternalImageUrls(),
        requirePrivateNetworkForUpdates: requirePrivateNetworkForUpdates(),
      },
    });
  } catch (error) {
    console.error("GET /api/system-info error:", error);
    return NextResponse.json({ error: "Failed to get system info" }, { status: 500 });
  }
}
