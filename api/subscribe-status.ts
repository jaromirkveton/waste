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
    const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
    const raw = entries ? Object.keys(entries).length : 0;
    const valid = entries
      ? Object.values(entries).filter((value) => {
          if (isValidSubscription(value)) return true;
          if (typeof value === "string" && value.startsWith("{")) {
            try {
              return isValidSubscription(JSON.parse(value));
            } catch {
              return false;
            }
          }
          return false;
        }).length
      : 0;

    return res.status(200).json({
      ok: true,
      subscriptions: valid,
      rawSubscriptions: raw,
      invalidSubscriptions: Math.max(0, raw - valid),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
