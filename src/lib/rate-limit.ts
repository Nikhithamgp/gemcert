/**
 * Simple fixed-window in-memory rate limiter.
 *
 * Good enough for a single always-on Node instance (the recommended deployment).
 * If you scale to several instances or serverless, swap this for a shared store
 * such as Redis/Upstash with the same interface.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
  }
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  const ok = bucket.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSec: ok ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export const LIMITS = {
  loginPerIp: { limit: 20, windowMs: 15 * 60_000 },
  loginPerAccount: { limit: 5, windowMs: 15 * 60_000 },
  publicLookup: { limit: 60, windowMs: 60_000 },
} as const;
