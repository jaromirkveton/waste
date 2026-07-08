import { getRedis } from "./redis";

export const SUBSCRIPTIONS_KEY = "push:subscriptions";
export const SUBSCRIPTIONS_LIST_KEY = "push:subscriptions:v2";

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export function isValidSubscription(
  value: unknown,
): value is StoredPushSubscription {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoredPushSubscription).endpoint === "string" &&
    typeof (value as StoredPushSubscription).keys?.p256dh === "string" &&
    typeof (value as StoredPushSubscription).keys?.auth === "string"
  );
}

function parseLegacyHashValue(value: unknown): StoredPushSubscription | null {
  if (isValidSubscription(value)) {
    return value;
  }

  if (typeof value === "string" && value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return isValidSubscription(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

async function readLegacyHashSubscriptions(): Promise<StoredPushSubscription[]> {
  const redis = getRedis();
  if (!redis) return [];

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  if (!entries) return [];

  const subscriptions: StoredPushSubscription[] = [];
  for (const [field, value] of Object.entries(entries)) {
    const parsed = parseLegacyHashValue(value);
    if (parsed) {
      subscriptions.push(parsed);
    }
  }

  return subscriptions;
}

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  const redis = getRedis();
  if (!redis) return [];

  const stored = await redis.get<StoredPushSubscription[]>(SUBSCRIPTIONS_LIST_KEY);
  if (Array.isArray(stored)) {
    return stored.filter(isValidSubscription);
  }

  return readLegacyHashSubscriptions();
}

export async function saveSubscription(
  subscription: StoredPushSubscription,
): Promise<number> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");

  const existing = await listSubscriptions();
  const next = [
    ...existing.filter((item) => item.endpoint !== subscription.endpoint),
    subscription,
  ];

  await redis.set(SUBSCRIPTIONS_LIST_KEY, next);
  await redis.del(SUBSCRIPTIONS_KEY);

  return next.length;
}

export async function removeSubscription(endpoint: string): Promise<number> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");

  const existing = await listSubscriptions();
  const next = existing.filter((item) => item.endpoint !== endpoint);
  await redis.set(SUBSCRIPTIONS_LIST_KEY, next);
  return next.length;
}

export async function countRawSubscriptions(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const listCount = (await listSubscriptions()).length;
  if (listCount > 0) {
    return listCount;
  }

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  return entries ? Object.keys(entries).length : 0;
}

export async function countValidSubscriptions(): Promise<number> {
  return (await listSubscriptions()).length;
}

export async function cleanupInvalidSubscriptions(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  const invalidCount = entries ? Object.keys(entries).length : 0;

  if (invalidCount > 0) {
    await redis.del(SUBSCRIPTIONS_KEY);
  }

  return invalidCount;
}

export async function prepareSubscriptionsForSend(): Promise<StoredPushSubscription[]> {
  const subscriptions = await listSubscriptions();
  if (subscriptions.length > 0) {
    return subscriptions;
  }

  const legacy = await readLegacyHashSubscriptions();
  if (legacy.length > 0) {
    const redis = getRedis();
    if (redis) {
      await redis.set(SUBSCRIPTIONS_LIST_KEY, legacy);
      await redis.del(SUBSCRIPTIONS_KEY);
    }
    return legacy;
  }

  await cleanupInvalidSubscriptions();
  return listSubscriptions();
}
