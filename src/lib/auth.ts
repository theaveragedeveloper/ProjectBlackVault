import { prisma } from "@/lib/prisma";
import {
  hashPassword as hashPasswordSync,
  verifyPassword as verifyPasswordSync,
} from "@/lib/password";

export async function hashPassword(plain: string): Promise<string> {
  return hashPasswordSync(plain);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return verifyPasswordSync(plain, hash);
}

export async function isPasswordSet(): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true },
  });
  return !!settings?.appPassword;
}
