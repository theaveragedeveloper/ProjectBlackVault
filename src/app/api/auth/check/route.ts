import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { extractSessionVersion, verifyTokenNode } from "@/lib/session";
import { getSessionSecret } from "@/lib/session-config";

export async function GET() {
  // Fail closed to first-run setup if setup-state lookup fails.
  let { passwordRequired } = deriveVaultSetupState(null);
  let authenticated = false;

  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({ data: { id: "singleton", sessionVersion: 1 } });
    }

    const cookieStore = await cookies();
    const session = cookieStore.get("vault_session");
    const passwordRequired = !!settings.appPassword;
    const secret = getSessionSecret();
    const authenticated = session?.value && secret
      ? (() => {
          if (!verifyTokenNode(session.value, secret)) return false;
          const sessionVersion = extractSessionVersion(session.value);
          return sessionVersion !== null && sessionVersion === (settings.sessionVersion || 1);
        })()
      : false;

    return NextResponse.json({ passwordRequired, authenticated });
  } catch (error) {
    console.error("GET /api/auth/check error:", error);
    return NextResponse.json({ passwordRequired: false, authenticated: false });
  }
  const requiresSetup = !passwordRequired;

  if (passwordRequired) {
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get(SESSION_COOKIE_NAME);
      const secret = getSessionSecret();
      authenticated = Boolean(
        session?.value
        && secret
        && verifyTokenNode(session.value, secret)
      );
    } catch (error) {
      console.error("GET /api/auth/check session verification failed", error);
    }
  }

  if (requiresSetup) {
    authenticated = false;
  }

  return noStoreJson({ authenticated, requiresSetup, passwordRequired });
}
