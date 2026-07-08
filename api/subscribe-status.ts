import { Redis } from "@upstash/redis";

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}

const SUBSCRIPTIONS_KEY = "push:subscriptions";

function getRedisEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return { url, token };
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { url, token } = getRedisEnv();
  if (!url || !token || !url.startsWith("https://")) {
    return res.status(503).json({ error: "Redis is not configured" });
  }

  try {
    const redis = new Redis({ url, token });
    const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
    const subscriptions = entries ? Object.keys(entries).length : 0;

    return res.status(200).json({ ok: true, subscriptions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
