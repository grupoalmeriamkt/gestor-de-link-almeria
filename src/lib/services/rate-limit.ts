import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Se Upstash não estiver configurado, o rate limit vira no-op (sempre permite).
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${limit}`;
  let l = limiters.get(key);
  if (!l) {
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, "1 m"),
      prefix: `glr:${name}`,
    });
    limiters.set(key, l);
  }
  return l;
}

/** Retorna true se permitido. Falha aberta (permite) quando Redis indisponível. */
export async function checkRateLimit(
  name: string,
  identifier: string,
  limitPerMinute: number,
): Promise<boolean> {
  const limiter = getLimiter(name, limitPerMinute);
  if (!limiter) return true;
  try {
    const { success } = await limiter.limit(identifier);
    return success;
  } catch {
    return true;
  }
}
