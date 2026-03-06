/**
 * In-memory rate limiter.
 *
 * ⚠️  This works correctly in single-process (local dev / single container) deployments.
 *     For serverless or multi-instance production, replace with Upstash Redis:
 *     https://github.com/upstash/ratelimit
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/analyze": { max: 20, windowMs: 60_000 },
  "/api/chat": { max: 30, windowMs: 60_000 },
  "/api/whatsapp": { max: 100, windowMs: 60_000 },
  "/api/scan-pill": { max: 15, windowMs: 60_000 },
  "/api/voice-processing": { max: 20, windowMs: 60_000 },
  default: { max: 60, windowMs: 60_000 },
};

export function checkRateLimit(
  ip: string,
  route: string
): { allowed: boolean; retryAfterMs: number } {
  const limit = LIMITS[route] ?? LIMITS["default"];
  const key = `${ip}:${route}`;
  const now = Date.now();

  let entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + limit.windowMs };
    rateLimitMap.set(key, entry);
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.count++;

  if (entry.count > limit.max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(request: Request): string {
  // x-forwarded-for is set by proxies; trim to first non-private IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip) return ip;
  }
  // Fallback: Vercel/CF specific headers
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * CORS headers.
 * ALLOWED_ORIGIN must be explicitly set in production — defaults to blocking all cross-origin.
 * Set ALLOWED_ORIGIN=* only for public read-only demo endpoints.
 */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** Helper: read & size-limit a request body */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number = 8192
): Promise<{ body: string; error?: never } | { body?: never; error: string }> {
  const bodyText = await request.text();
  if (Buffer.byteLength(bodyText, "utf8") > maxBytes) {
    return { error: `Request body exceeds ${maxBytes} byte limit` };
  }
  return { body: bodyText };
}
