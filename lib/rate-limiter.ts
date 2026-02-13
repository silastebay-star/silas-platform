/**
 * Simple in-memory rate limiter for Next.js API routes.
 * Not suitable for production in a distributed environment without a shared store (e.g., Redis).
 */

const rateLimitStore = new Map<string, { count: number; lastReset: number }>()

interface RateLimitOptions {
  interval: number // in milliseconds
  maxRequests: number
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, maxRequests } = options

  return (ip: string): { allowed: boolean; remaining: number; reset: number } => {
    const now = Date.now()
    let entry = rateLimitStore.get(ip)

    if (!entry || now - entry.lastReset > interval) {
      entry = { count: 0, lastReset: now }
      rateLimitStore.set(ip, entry)
    }

    entry.count++

    const allowed = entry.count <= maxRequests
    const remaining = allowed ? maxRequests - entry.count : 0
    const reset = entry.lastReset + interval

    return { allowed, remaining, reset }
  }
}

// Pre-configured rate limiters
export const createGroupRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 requests per minute per IP
})

export const createProjectRateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 3, // 3 requests per minute per IP
})

export const defaultApiRateLimiter = rateLimit({
  interval: 15 * 1000, // 15 seconds
  maxRequests: 10, // 10 requests per 15 seconds per IP
})
