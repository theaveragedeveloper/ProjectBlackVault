import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";
import { sessionOptions } from "@/lib/session";

// These paths are always accessible without authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/status",
  "/api/health",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths, Next.js internals, static assets, and uploads
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/uploads/")
  ) {
    return NextResponse.next();
  }

  // Check session — iron-session middleware signature uses (request, response, options)
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.authenticated) {
    // API routes get a 401 JSON response
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes redirect to /login with a return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated — redirect away from the login page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Match everything except Next.js static files and image optimization
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
