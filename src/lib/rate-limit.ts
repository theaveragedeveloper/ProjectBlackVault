const attempts = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  key: string;
  windowMs: number;
  maxAttempts: number;
}

export async function enforceRateLimit(options: RateLimitOptions): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const existing = attempts.get(options.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    attempts.set(options.key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(options.maxAttempts - 1, 0), resetAt };
  }

  existing.count += 1;
  attempts.set(options.key, existing);

  return {
    allowed: existing.count <= options.maxAttempts,
    remaining: Math.max(options.maxAttempts - existing.count, 0),
    resetAt: existing.resetAt,
  };
}
