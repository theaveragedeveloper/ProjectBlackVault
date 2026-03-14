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

// Reject oversized request bodies early (before route handlers read them).
// 10 MB is a generous limit; individual routes may enforce tighter limits.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

  // Reject oversized payloads at the edge before any route handler runs.
  // Only Content-Length is available here (Edge Runtime cannot buffer the body).
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }

  const isApiRoute = pathname.startsWith("/api/");

  const session = request.cookies.get("vault_session")?.value;

  if (!session) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify HMAC signature when SESSION_SECRET is configured.
  // Without a secret the signature cannot be checked, but we still require
  // the cookie to be present so that at minimum the login flow was completed.
  if (sessionSecret) {
    const valid = await verifyWithWebCrypto(session, sessionSecret);
    if (!valid) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public).*)", "/api/:path*"],
};
