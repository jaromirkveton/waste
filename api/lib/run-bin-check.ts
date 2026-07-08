import { detectEmptiedBins, type EmptiedBin } from "./detect-emptied";
import { fetchBinReadings } from "./golemio";
import { sendEmptiedNotifications } from "./push";
import {
  getBinState,
  hasStorage,
  listSubscriptions,
  saveBinState,
  type BinSnapshot,
} from "./storage";

export interface BinCheckResult {
  stationReadings: BinSnapshot[];
  previous: BinSnapshot[];
  emptied: EmptiedBin[];
  subscriptions: number;
  notifications: { sent: number; failed: number };
  stateSaved: boolean;
}

export async function runBinCheck(): Promise<BinCheckResult> {
  if (!hasStorage()) {
    throw new Error("Redis is not configured");
  }

  const readings = await fetchBinReadings();
  const previous = await getBinState();
  const { emptied, nextState } = detectEmptiedBins(previous, readings);

  const subscriptions = await listSubscriptions();
  const notifications = await sendEmptiedNotifications(subscriptions, emptied);

  const stateSaved =
    emptied.length === 0 || notifications.sent > 0;

  if (stateSaved) {
    await saveBinState(nextState);
  }

  return {
    stationReadings: readings,
    previous,
    emptied,
    subscriptions: subscriptions.length,
    notifications,
    stateSaved,
  };
}
