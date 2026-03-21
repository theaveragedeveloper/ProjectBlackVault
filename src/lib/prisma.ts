import { PrismaClient } from "@prisma/client";
import { assertRuntimeConfig } from "@/lib/runtime-config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

assertRuntimeConfig();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
