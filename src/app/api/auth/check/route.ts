import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionSecret, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";
import { getVaultSetupState } from "@/lib/auth-state";

type AuthCheckResponse = {
  authenticated: boolean;
  requiresSetup: boolean;
  passwordRequired: boolean;
};

function noStoreJson(payload: AuthCheckResponse) {
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  let passwordRequired = false;
  let requiresSetup = false;
  let authenticated = false;

  try {
    const setupState = await getVaultSetupState();
    passwordRequired = setupState.passwordRequired;
    requiresSetup = setupState.requiresSetup;
  } catch (error) {
    console.error("GET /api/auth/check setup-state failed", error);
  }

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

  if (requiresSetup) {
    authenticated = false;
  }

  return noStoreJson({ authenticated, requiresSetup, passwordRequired });
}
