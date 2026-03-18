import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function isPasswordSet(): Promise<boolean> {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
    select: { appPassword: true },
  });
  return !!settings?.appPassword;
}
