import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  addSubscription,
  hasStorage,
  removeSubscription,
  type StoredPushSubscription,
} from "./lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!hasStorage()) {
      return res.status(503).json({
        error:
          "Redis není nakonfigurovaný. Ve Vercelu přidejte Upstash Redis integraci.",
      });
    }

    if (req.method === "POST") {
      const subscription = req.body as StoredPushSubscription | undefined;
      if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return res.status(400).json({ error: "Neplatná data odběru notifikací." });
      }

      await addSubscription(subscription);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      const endpoint =
        typeof req.body?.endpoint === "string" ? req.body.endpoint : undefined;
      if (!endpoint) {
        return res.status(400).json({ error: "Chybí endpoint odběru." });
      }

      await removeSubscription(endpoint);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
