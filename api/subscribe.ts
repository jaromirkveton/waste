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

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return new Redis({ url, token });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const redis = getRedis();
    if (!redis) {
      return res.status(503).json({
        error:
          "Redis není nakonfigurovaný. Ve Vercelu přidejte Upstash Redis integraci.",
      });
    }

    if (req.method === "POST") {
      const subscription = req.body as StoredPushSubscription | undefined;
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
        JSON.stringify(subscription),
      );

      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const body = req.body as { endpoint?: string } | undefined;
      if (!body?.endpoint) {
        return res.status(400).json({ error: "Chybí endpoint odběru." });
      }

      await redis.hdel(SUBSCRIPTIONS_KEY, body.endpoint);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
