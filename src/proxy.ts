import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/session-edge";
import { getSessionSecret } from "@/lib/session-config";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/health",
  "/_next",
  "/favicon",
  "/icons",
  "/manifest",
  "/apple-touch",
  "/download",
];

// Reject oversized request bodies early (before route handlers read them).
// 10 MB is a generous limit; individual routes may enforce tighter limits.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return NextResponse.next();
  }

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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const sessionSecret = getSessionSecret();
  if (!sessionSecret) {
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Server misconfiguration: SESSION_SECRET is required for protected API routes." },
        { status: 500 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const hasVersionPrefix = /^\d+:[^\s]+\./.test(session);
  const valid = hasVersionPrefix ? await verifyTokenEdge(session, sessionSecret) : false;
  if (!valid) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.webp$|.*\\.ico$).*)",
    "/api/:path*",
  ],
};
