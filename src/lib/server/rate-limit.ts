/**
 * Process-local sliding window. No database. Fine for one Node process
 * and a single Vercel isolate; Redis can replace the Map later.
 */

const buckets = new Map<string, number[]>();
const MAX_KEYS = 20_000;
const WINDOW_MS = 15 * 60 * 1000;

type Scope = "login" | "forgot-password";

const SCOPE_LIMITS: Record<
  Scope,
  { pair: number; ip: number; windowMs: number }
> = {
  login: { pair: 5, ip: 20, windowMs: WINDOW_MS },
  "forgot-password": { pair: 5, ip: 20, windowMs: WINDOW_MS },
};

function clientIp(request: Request): string {
  return (
    headerIp(request, "x-real-ip") ||
    headerIp(request, "x-vercel-forwarded-for") ||
    headerIp(request, "cf-connecting-ip") ||
    headerIp(request, "x-forwarded-for") ||
    "unknown"
  );
}

function headerIp(request: Request, name: string): string | null {
  const raw = request.headers.get(name);
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim();
  return first || null;
}

function pairKey(scope: Scope, ip: string, email: string): string {
  return `pair:${scope}:${ip}:${email.trim().toLowerCase()}`;
}

function ipKey(scope: Scope, ip: string): string {
  return `ip:${scope}:${ip}`;
}

function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const prev = (buckets.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (prev.length === 0) buckets.delete(key);
  if (prev.length >= limit) {
    buckets.set(key, prev);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((prev[0] + windowMs - now) / 1000),
    );
    return { ok: false, retryAfterSec };
  }
  prev.push(now);
  buckets.set(key, prev);
  pruneBuckets();
  return { ok: true };
}

/**
 * Counts this attempt against the IP+email pair and the IP-only bucket.
 * On success, call `resetRateLimit` with `pairKey` only — the IP bucket stays.
 */
export function enforceRateLimit(
  request: Request,
  scope: Scope,
  email: string,
):
  | { ok: true; pairKey: string }
  | { ok: false; retryAfterSec: number } {
  const ip = clientIp(request);
  const limits = SCOPE_LIMITS[scope];
  const ipHit = consumeRateLimit(
    ipKey(scope, ip),
    limits.ip,
    limits.windowMs,
  );
  if (!ipHit.ok) return ipHit;
  const pair = pairKey(scope, ip, email);
  const pairHit = consumeRateLimit(pair, limits.pair, limits.windowMs);
  if (!pairHit.ok) return pairHit;
  return { ok: true, pairKey: pair };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

function pruneBuckets(): void {
  if (buckets.size <= MAX_KEYS) return;
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, stamps] of buckets) {
    const newest = stamps[stamps.length - 1];
    if (newest == null || newest <= cutoff) buckets.delete(key);
  }
  if (buckets.size <= MAX_KEYS) return;
  const excess = buckets.size - Math.floor(MAX_KEYS / 2);
  let dropped = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    if (++dropped >= excess) break;
  }
}
