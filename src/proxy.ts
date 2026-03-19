import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "vault_session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/_next/")) return true;
  return false;
}

type AuthBootstrap = {
  authenticated: boolean;
  requiresSetup: boolean;
};

async function getAuthBootstrap(request: NextRequest): Promise<AuthBootstrap | null> {
  const checkUrl = new URL("/api/auth/check", request.url);
  try {
    const res = await fetch(checkUrl, {
      method: "GET",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json() as Partial<AuthBootstrap>;
    if (typeof json.authenticated !== "boolean" || typeof json.requiresSetup !== "boolean") {
      return null;
    }
    return {
      authenticated: json.authenticated,
      requiresSetup: json.requiresSetup,
    };
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, clearCookie: boolean) {
  const loginUrl = new URL("/login", request.url);

  const response = NextResponse.redirect(loginUrl);
  if (clearCookie) {
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

  const bootstrap = await getAuthBootstrap(request);

  // Resolve first-run state before applying auth redirects.
  // If setup is still required, always send users to the setup flow.
  if (bootstrap?.requiresSetup) {
    return redirectToLogin(request, false);
  }

  // If we cannot determine auth state, fail closed to the login route.
  if (!bootstrap) {
    return redirectToLogin(request, false);
  }

  if (!bootstrap.authenticated) {
    const hasSessionCookie = !!request.cookies.get(SESSION_COOKIE_NAME)?.value;
    return redirectToLogin(request, hasSessionCookie);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|public).*)",
  ],
};
