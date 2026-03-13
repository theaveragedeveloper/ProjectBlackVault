import { NextRequest, NextResponse } from "next/server";
import { getSessionSecret } from "@/lib/session-config";

const sessionSecret = getSessionSecret();
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health", "/_next", "/favicon.ico"];

async function verifyWithWebCrypto(signed: string, secret: string): Promise<boolean> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;

  const token = signed.slice(0, lastDot);
  const providedHex = signed.slice(lastDot + 1);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(token));
  const expectedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (providedHex.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < providedHex.length; i++) {
    diff |= providedHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  }
  return diff === 0;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");

  // Preserve prior API middleware behavior: if SESSION_SECRET is unset, skip API auth checks.
  if (isApiRoute && !sessionSecret) {
    return NextResponse.next();
  }

  const session = request.cookies.get("vault_session")?.value;
  if (!session) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionSecret) {
    const valid = await verifyWithWebCrypto(session, sessionSecret);
    if (!valid) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public).*)", "/api/:path*"],
};
