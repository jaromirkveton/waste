import type { VercelRequest, VercelResponse } from "@vercel/node";
import { detectEmptiedBins } from "../../shared/bin-snapshot.js";
import { fetchBinReadings } from "../lib/golemio.js";
import { sendEmptiedNotifications } from "../lib/push.js";
import {
  getBinState,
  hasStorage,
  listSubscriptions,
  saveBinState,
} from "../lib/storage.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!hasStorage()) {
    return res.status(503).json({ error: "Redis is not configured" });
  }

  try {
    const readings = await fetchBinReadings();
    const previous = await getBinState();
    const { emptied, nextState } = detectEmptiedBins(previous, readings);

    await saveBinState(nextState);

    const subscriptions = await listSubscriptions();
    const { sent, failed } = await sendEmptiedNotifications(subscriptions, emptied);

    return res.status(200).json({
      ok: true,
      readings: readings.length,
      emptied: emptied.length,
      notifications: { sent, failed },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
