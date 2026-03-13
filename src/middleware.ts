import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// API paths that don't require authentication
const PUBLIC_PREFIXES = ["/api/auth/", "/api/health"];

/**
 * Verify a signed HMAC token using the Web Crypto API (Edge-runtime compatible).
 * Token format: `{rawToken}.{sha256HmacHex}`
 */
async function verifyHmac(signed: string, secret: string): Promise<boolean> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;

  const token = signed.slice(0, lastDot);
  const provided = signed.slice(lastDot + 1);

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(token));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard API routes
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  // Public endpoints: auth and health
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // If SESSION_SECRET is not set (dev mode / no-auth install), allow everything through
  const secret = process.env.SESSION_SECRET;
  if (!secret) return NextResponse.next();

  // Validate the session cookie
  const token = request.cookies.get("vault_session")?.value;
  if (!token || !(await verifyHmac(token, secret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
