import { getRedis, getRedisConfigError } from "./redis";
import {
  cleanupInvalidSubscriptions,
  countRawSubscriptions,
  countValidSubscriptions,
  listSubscriptions,
  removeSubscription,
  saveSubscription,
  type StoredPushSubscription,
} from "./subscriptions";

const BIN_STATE_KEY = "bins:state";

export interface BinSnapshot {
  containerId: number;
  trashType: string;
  percent: number;
}

export type { StoredPushSubscription };

export function hasStorage(): boolean {
  return getRedisConfigError() === null;
}

export async function addSubscription(
  subscription: StoredPushSubscription,
): Promise<void> {
  await saveSubscription(subscription);
}

export { removeSubscription, listSubscriptions };

export async function countSubscriptions(): Promise<number> {
  return countValidSubscriptions();
}

export async function getBinState(): Promise<BinSnapshot[]> {
  const redis = getRedis();
  if (!redis) return [];

  const state = await redis.get<BinSnapshot[]>(BIN_STATE_KEY);
  return state ?? [];
}

export async function saveBinState(state: BinSnapshot[]): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  await redis.set(BIN_STATE_KEY, state);
}

export async function prepareSubscriptionsForSend(): Promise<StoredPushSubscription[]> {
  const subscriptions = await listSubscriptions();
  if (subscriptions.length > 0) {
    return subscriptions;
  }

  const rawCount = await countRawSubscriptions();
  if (rawCount === 0) {
    return [];
  }

  await cleanupInvalidSubscriptions();
  return listSubscriptions();
}

export { countRawSubscriptions, countValidSubscriptions, cleanupInvalidSubscriptions };
