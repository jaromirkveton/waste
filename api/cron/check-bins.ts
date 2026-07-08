import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runBinCheck } from "../lib/run-bin-check";
import { hasStorage } from "../lib/storage";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!hasStorage()) {
    return res.status(503).json({ error: "Redis is not configured" });
  }

  try {
    const result = await runBinCheck();

    return res.status(200).json({
      ok: true,
      readings: result.stationReadings.length,
      previous: result.previous,
      current: result.stationReadings,
      emptied: result.emptied,
      subscriptions: result.subscriptions,
      notifications: result.notifications,
      stateSaved: result.stateSaved,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
