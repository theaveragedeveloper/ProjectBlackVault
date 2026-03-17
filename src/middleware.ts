import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/lib/session-edge";

const PUBLIC_API_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/check",
  "/api/auth/logout",
  "/api/health",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("vault_session")?.value;
  if (!sessionCookie) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    // Development fallback: when SESSION_SECRET is not configured,
    // login stores a random token directly in the cookie.
    return NextResponse.next();
  }

  const valid = await verifyTokenEdge(sessionCookie, sessionSecret);
  if (!valid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
