import { NextResponse } from "next/server";
import { getLocalIp } from "@/lib/network/get-local-ip";

export const runtime = "nodejs";

function getAppPort(): string {
  return process.env.PORT || "3000";
}

export async function GET() {
  try {
    const ip = getLocalIp();
    const port = getAppPort();

    if (!ip) {
      return NextResponse.json({
        ip: null,
        port,
        url: null,
        message: "Unable to detect local network IP",
      });
    }

    return NextResponse.json({
      ip,
      port,
      url: `http://${ip}:${port}`,
      message: null,
    });
  } catch (error) {
    console.error("GET /api/network/local-access error:", error);
    return NextResponse.json({
      ip: null,
      port: getAppPort(),
      url: null,
      message: "Unable to detect local network IP",
    });
  }
}
