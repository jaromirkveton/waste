import { Redis } from "@upstash/redis";

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}

interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const SUBSCRIPTIONS_KEY = "push:subscriptions";

function getRedisEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return { url, token };
}

function getRedisConfigError(): "missing" | "invalid_url" | null {
  const { url, token } = getRedisEnv();
  if (!url || !token) return "missing";
  if (!url.startsWith("https://")) return "invalid_url";
  return null;
}

function getRedisConfigErrorMessage(
  error: "missing" | "invalid_url",
): string {
  if (error === "missing") {
    return "Redis není nakonfigurovaný. Ve Vercelu přidejte Upstash Redis integraci.";
  }

  const { url } = getRedisEnv();
  return `Redis URL není platná (musí začínat https://). Ve Vercelu opravte UPSTASH_REDIS_REST_URL — aktuálně: "${url ?? ""}". Hodnotu najdete v Upstash konzoli u databáze jako REST URL.`;
}

function parseRequestBody(body: unknown): unknown {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return undefined;
    }
  }

  return body;
}

async function countSubscriptions(redis: Redis): Promise<number> {
  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  return entries ? Object.keys(entries).length : 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const configError = getRedisConfigError();
    if (configError) {
      return res.status(503).json({
        error: getRedisConfigErrorMessage(configError),
      });
    }

    const { url, token } = getRedisEnv();
    const redis = new Redis({ url: url!, token: token! });

    if (req.method === "POST") {
      const subscription = parseRequestBody(req.body) as
        | StoredPushSubscription
        | undefined;
      if (
        !subscription?.endpoint ||
        !subscription.keys?.p256dh ||
        !subscription.keys?.auth
      ) {
        return res.status(400).json({ error: "Neplatná data odběru notifikací." });
      }

      await redis.hset(
        SUBSCRIPTIONS_KEY,
        subscription.endpoint,
        subscription,
      );

      const subscriptions = await countSubscriptions(redis);
      return res.status(200).json({ ok: true, subscriptions });
    }

    if (req.method === "DELETE") {
      const body = parseRequestBody(req.body) as { endpoint?: string } | undefined;
      if (!body?.endpoint) {
        return res.status(400).json({ error: "Chybí endpoint odběru." });
      }

      await redis.hdel(SUBSCRIPTIONS_KEY, body.endpoint);
      const subscriptions = await countSubscriptions(redis);
      return res.status(200).json({ ok: true, subscriptions });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
