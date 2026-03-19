import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionSecret, verifyTokenNode, SESSION_COOKIE_NAME } from "@/lib/session";
import { getVaultSetupState } from "@/lib/auth-state";

export async function GET() {
  try {
    const { passwordRequired, requiresSetup } = await getVaultSetupState();

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    const secret = getSessionSecret();
    const authenticated = session?.value && secret
      ? verifyTokenNode(session.value, secret)
      : false;

    return NextResponse.json(
      { passwordRequired, requiresSetup, authenticated },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/auth/check failed", error);
    return NextResponse.json(
      { error: "Unable to verify authentication state." },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
