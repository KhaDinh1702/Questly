// Simple sliding-window rate limiter (in-memory, per Cloudflare Worker isolate)
// For production, upgrade to Cloudflare KV or Durable Objects for global limits.

const ipMap = new Map()

/**
 * createRateLimiter({ windowMs, max })
 * Returns a Hono middleware that allows max requests per windowMs.
 */
export function createRateLimiter({ windowMs = 60_000, max = 20 } = {}) {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown'
    const now = Date.now()

    if (!ipMap.has(ip)) {
      ipMap.set(ip, { count: 1, windowStart: now })
    } else {
      const record = ipMap.get(ip)
      if (now - record.windowStart > windowMs) {
        record.count = 1
        record.windowStart = now
      } else {
        record.count++
        if (record.count > max) {
          return c.json({ error: 'Too many requests. Please wait before trying again.' }, 429)
        }
      }
    }
    await next()
  }
}
