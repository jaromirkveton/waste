import { detectEmptiedBins, type EmptiedBin } from "./detect-emptied";
import { fetchBinReadings } from "./golemio";
import { sendEmptiedNotifications } from "./push";
import {
  getBinState,
  hasStorage,
  countRawSubscriptions,
  countValidSubscriptions,
  prepareSubscriptionsForSend,
  saveBinState,
  type BinSnapshot,
} from "./storage";

export interface BinCheckResult {
  stationReadings: BinSnapshot[];
  previous: BinSnapshot[];
  emptied: EmptiedBin[];
  subscriptions: number;
  storedSubscriptions: number;
  rawSubscriptions: number;
  cleanedInvalidSubscriptions: number;
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

  const rawSubscriptions = await countRawSubscriptions();
  const validBefore = await countValidSubscriptions();
  const subscriptions = await prepareSubscriptionsForSend();
  const storedSubscriptions = subscriptions.length;
  const cleanedInvalidSubscriptions =
    validBefore === 0 && rawSubscriptions > storedSubscriptions
      ? rawSubscriptions - storedSubscriptions
      : 0;
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
    storedSubscriptions,
    rawSubscriptions,
    cleanedInvalidSubscriptions,
    notifications,
    stateSaved,
  };
}
