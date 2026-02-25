// Simple in-memory rate limiter.
// Note: resets per serverless instance — use Upstash Redis for multi-instance production.

const store = new Map();

/**
 * @param {string} key  - unique identifier (e.g. userId + route)
 * @param {number} limit  - max requests allowed in the window
 * @param {number} windowMs - time window in milliseconds
 * @returns {{ success: boolean, remaining: number }}
 */
export function rateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const windowStart = now - windowMs;

  const hits = (store.get(key) || []).filter((t) => t > windowStart);

  if (hits.length >= limit) {
    return { success: false, remaining: 0 };
  }

  hits.push(now);
  store.set(key, hits);

  // Prevent unbounded memory growth
  if (store.size > 10000) {
    for (const [k, v] of store.entries()) {
      if (v.every((t) => t < windowStart)) store.delete(k);
    }
  }

  return { success: true, remaining: limit - hits.length };
}
