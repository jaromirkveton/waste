import { Redis } from "@upstash/redis";

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const SUBSCRIPTIONS_LIST_KEY = "push:subscriptions:v2";

function getRedisEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return { url, token };
}

function isValidSubscription(value: unknown): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { endpoint?: string }).endpoint === "string" &&
    typeof (value as { keys?: { p256dh?: string } }).keys?.p256dh === "string" &&
    typeof (value as { keys?: { auth?: string } }).keys?.auth === "string"
  );
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { url, token } = getRedisEnv();
  if (!url || !token || !url.startsWith("https://")) {
    return res.status(503).json({ error: "Redis is not configured" });
  }

  try {
    const redis = new Redis({ url, token });
    const stored = await redis.get<unknown[]>(SUBSCRIPTIONS_LIST_KEY);
    const valid = Array.isArray(stored)
      ? stored.filter(isValidSubscription).length
      : 0;

    const legacyEntries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
    const rawLegacy = legacyEntries ? Object.keys(legacyEntries).length : 0;

    return res.status(200).json({
      ok: true,
      subscriptions: valid,
      rawSubscriptions: valid + rawLegacy,
      invalidSubscriptions: rawLegacy,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
