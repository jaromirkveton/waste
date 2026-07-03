import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { PushSubscriptionJSON } from "web-push";
import { addSubscription, hasStorage, removeSubscription } from "../lib/storage.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!hasStorage()) {
    return res.status(503).json({
      error: "Redis není nakonfigurovaný. Přidejte Upstash Redis integraci ve Vercelu.",
    });
  }

  if (req.method === "POST") {
    const subscription = req.body as PushSubscriptionJSON | undefined;
    if (!subscription?.endpoint || !subscription.keys) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    await addSubscription(subscription);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const endpoint =
      typeof req.body?.endpoint === "string" ? req.body.endpoint : undefined;
    if (!endpoint) {
      return res.status(400).json({ error: "Missing subscription endpoint" });
    }

    await removeSubscription(endpoint);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
