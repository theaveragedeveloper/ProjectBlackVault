import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionSecret, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";
import { getVaultSetupState } from "@/lib/auth-state";
import { toStorageStartupError } from "@/lib/user-facing-errors";

type AuthCheckResponse = {
  authenticated: boolean;
  requiresSetup: boolean;
  passwordRequired: boolean;
  error?: string;
};

function noStoreJson(payload: AuthCheckResponse, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  // Fail closed to login mode if setup-state lookup fails.
  let passwordRequired = true;
  let authenticated = false;

  try {
    const setupState = await getVaultSetupState();
    passwordRequired = setupState.passwordRequired;
  } catch (error) {
    console.error("GET /api/auth/check setup-state failed", error);
    const mapped = toStorageStartupError(
      error,
      "Unable to verify vault setup state."
    );
    return noStoreJson(
      {
        authenticated: false,
        requiresSetup: false,
        passwordRequired: true,
        error: mapped.error,
      },
      mapped.status
    );
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
