/**
 * In-memory fixed-window rate limiter. PetZone runs as a single persistent
 * Node process, so process-local buckets are accurate; if deployment ever
 * scales to multiple instances, swap this for a shared store (Redis/Upstash)
 * or move enforcement to Cloudflare rules.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

const SWEEP_INTERVAL_MS = 60_000
// Route handlers are exercised repeatedly inside the test suite; limiting is
// a deployment concern and stays disabled under vitest.
const isTestEnv = process.env.NODE_ENV === 'test'

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (isTestEnv) return { allowed: true }
  const now = Date.now()
  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey)
    }
    lastSweep = now
  }
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count += 1
  return { allowed: true }
}

export function rateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = result.allowed ? 60 : result.retryAfterSeconds
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429, headers: { 'retry-after': String(retryAfter) } },
  )
}
