export function isSameOriginMutation(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const requestBuckets = new Map<string, RateLimitBucket>();

export function checkRequestRateLimit(
  req: Request,
  scope: string,
  limit = 12,
  windowMs = 10 * 60 * 1000,
): { allowed: boolean; retryAfterSeconds: number } {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress =
    forwardedFor || req.headers.get("x-real-ip")?.trim() || "unknown";
  const key = `${scope}:${clientAddress}`;
  const now = Date.now();
  const current = requestBuckets.get(key);

  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
