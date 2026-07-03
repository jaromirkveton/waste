import {
  getRedis,
  getRedisConfigError,
  getRedisConfigErrorMessage,
} from "./lib/redis";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const configError = getRedisConfigError();
    if (configError) {
      return res.status(503).json({
        error: getRedisConfigErrorMessage(configError),
      });
    }

    const redis = getRedis();
    if (!redis) {
      return res.status(503).json({
        error: getRedisConfigErrorMessage("missing"),
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
