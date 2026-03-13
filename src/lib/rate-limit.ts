import { prisma } from "@/lib/prisma";

export async function enforceRateLimit(options: {
  key: string;
  windowMs: number;
  maxAttempts: number;
}): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const now = Date.now();
  const windowStart = new Date(now - options.windowMs);
  const bucketId = `${options.key}:${Math.floor(now / options.windowMs)}`;

  await prisma.apiRateLimit.deleteMany({ where: { key: options.key, windowStart: { lt: windowStart } } });

  const existing = await prisma.apiRateLimit.findUnique({ where: { bucketId } });
  if (!existing) {
    await prisma.apiRateLimit.create({
      data: {
        bucketId,
        key: options.key,
        windowStart: new Date(Math.floor(now / options.windowMs) * options.windowMs),
        count: 1,
      },
    });
    return { allowed: true, retryAfterSec: Math.ceil(options.windowMs / 1000) };
  }

  if (existing.count >= options.maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.windowStart.getTime() + options.windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  await prisma.apiRateLimit.update({ where: { bucketId }, data: { count: { increment: 1 } } });
  return { allowed: true, retryAfterSec: Math.ceil(options.windowMs / 1000) };
}
