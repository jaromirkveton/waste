import type { VercelRequest, VercelResponse } from "@vercel/node";
import { detectEmptiedBins } from "../lib/detect-emptied";
import { fetchBinReadings } from "../lib/golemio";
import { sendEmptiedNotifications } from "../lib/push";
import {
  getBinState,
  hasStorage,
  listSubscriptions,
  saveBinState,
} from "../lib/storage";

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
