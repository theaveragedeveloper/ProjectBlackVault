import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";
import { hashPassword } from "@/lib/password";
import { getSessionSecret, signToken, SESSION_COOKIE_NAME } from "@/lib/session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function noStoreJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function shouldUseSecureCookie(request: NextRequest): boolean {
  const override = (process.env.SESSION_COOKIE_SECURE ?? "auto").trim().toLowerCase();
  if (override === "true" || override === "1" || override === "yes") return true;
  if (override === "false" || override === "0" || override === "no") return false;

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    ?.toLowerCase();
  if (forwardedProto) return forwardedProto === "https";
  return request.nextUrl.protocol === "https:";
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return noStoreJson({ error: "Invalid request body" }, 400);
    }

    const parsedBody = typeof body === "object" && body !== null
      ? body as Record<string, unknown>
      : {};
    const password = parsedBody.password;
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedPassword) {
      return noStoreJson({ error: "Vault password is required." }, 400);
    }
    if (normalizedPassword.length > 1024) {
      return noStoreJson({ error: "Vault password is too long." }, 400);
    }

    const sessionSecret = getSessionSecret();
    if (!sessionSecret) {
      return noStoreJson({ error: "Authentication service is unavailable." }, 503);
    }

    await prisma.appSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
      },
      update: {},
    });

    const passwordHash = hashPassword(normalizedPassword);
    const updateResult = await prisma.appSettings.updateMany({
      where: {
        id: "singleton",
        appPassword: null,
      },
      data: {
        appPassword: passwordHash,
      },
    });

    if (updateResult.count === 0) {
      return noStoreJson({ error: "Vault has already been initialized." }, 409);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const cookieValue = signToken(token, sessionSecret);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: shouldUseSecureCookie(request),
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return noStoreJson({ success: true });
  } catch (error) {
    console.error("POST /api/auth/setup failed", error);
    return noStoreJson({ error: "Setup failed" }, 500);
  }
}
