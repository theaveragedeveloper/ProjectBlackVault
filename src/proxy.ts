import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "vault_session";
const MIN_SESSION_SECRET_LENGTH = 32;

async function verifyWithWebCrypto(signed: string, secret: string): Promise<boolean> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return false;
  const token = signed.slice(0, lastDot);
  const providedHex = signed.slice(lastDot + 1);
  if (!/^[0-9a-f]+$/i.test(providedHex)) return false;

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

function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < MIN_SESSION_SECRET_LENGTH) return null;
  return secret;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

function redirectToLogin(request: NextRequest, reason: "missing" | "invalid") {
  const loginUrl = new URL("/login", request.url);

  const response = NextResponse.redirect(loginUrl);
  if (reason === "invalid") {
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME);
  if (!session?.value) {
    return redirectToLogin(request, "missing");
  }

  const secret = getSessionSecret();
  if (!secret) {
    return redirectToLogin(request, "missing");
  }

  const valid = await verifyWithWebCrypto(session.value, secret);
  if (!valid) {
    return redirectToLogin(request, "invalid");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
