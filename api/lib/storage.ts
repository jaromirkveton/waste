import { getRedis, getRedisConfigError } from "./redis";

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const BIN_STATE_KEY = "bins:state";

export interface BinSnapshot {
  containerId: number;
  trashType: string;
  percent: number;
}

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export function hasStorage(): boolean {
  return getRedisConfigError() === null;
}

function parseSubscription(value: unknown): StoredPushSubscription | null {
  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : value;

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as StoredPushSubscription).endpoint === "string" &&
      (parsed as StoredPushSubscription).keys?.p256dh &&
      (parsed as StoredPushSubscription).keys?.auth
    ) {
      return parsed as StoredPushSubscription;
    }
  } catch {
    // Skip legacy or corrupt hash entries.
  }

  return null;
}

function countStoredSubscriptions(
  entries: Record<string, unknown> | null,
): number {
  if (!entries) return 0;

  return Object.values(entries)
    .map(parseSubscription)
    .filter((subscription): subscription is StoredPushSubscription =>
      subscription !== null,
    ).length;
}

export async function addSubscription(
  subscription: StoredPushSubscription,
): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");

  await redis.hset(SUBSCRIPTIONS_KEY, subscription.endpoint, subscription);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
}

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  const redis = getRedis();
  if (!redis) return [];

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  if (!entries) return [];

  const subscriptions = Object.values(entries)
    .map(parseSubscription)
    .filter((subscription): subscription is StoredPushSubscription =>
      subscription !== null,
    );

  if (subscriptions.length === 0 && Object.keys(entries).length > 0) {
    console.error(
      `Found ${Object.keys(entries).length} Redis subscription entries, but none parsed.`,
    );
  }

  return subscriptions;
}

export async function countSubscriptions(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  return countStoredSubscriptions(entries);
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
