import { NextRequest, NextResponse } from "next/server";
import { getSessionSecret } from "@/lib/session-config";

const sessionSecret = getSessionSecret();

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
    ["sign"]
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
  const session = request.cookies.get("vault_session");
  const { pathname } = request.nextUrl;

  // Always allow these paths without auth
  const publicPaths = ["/login", "/api/auth", "/_next", "/favicon.ico", "/api/health"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // If no session cookie, redirect to login
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate the session signature if SESSION_SECRET is configured
  if (sessionSecret) {
    const valid = await verifyWithWebCrypto(session.value, sessionSecret);
    if (!valid) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
