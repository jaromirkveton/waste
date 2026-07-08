import { runBinCheck } from "./lib/run-bin-check";
import { hasStorage } from "./lib/storage";

interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!hasStorage()) {
    return res.status(503).json({ error: "Redis is not configured" });
  }

  try {
    const result = await runBinCheck();

    return res.status(200).json({
      ok: true,
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
