import { getRedis } from "./redis";

export const SUBSCRIPTIONS_KEY = "push:subscriptions";

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

function isSubscription(value: unknown): value is StoredPushSubscription {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as StoredPushSubscription).endpoint === "string" &&
    typeof (value as StoredPushSubscription).keys?.p256dh === "string" &&
    typeof (value as StoredPushSubscription).keys?.auth === "string"
  );
}

export function parseSubscriptionEntry(
  field: string,
  value: unknown,
): StoredPushSubscription | null {
  if (isSubscription(value)) {
    return value;
  }

  if (typeof value === "string") {
    if (value.startsWith("{")) {
      try {
        return parseSubscriptionEntry(field, JSON.parse(value));
      } catch {
        return null;
      }
    }

    return null;
  }

  return null;
}

export async function saveSubscription(
  subscription: StoredPushSubscription,
): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");

  await redis.hset(
    SUBSCRIPTIONS_KEY,
    subscription.endpoint,
    JSON.stringify(subscription),
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
}

export async function readSubscriptionEntries(): Promise<
  Record<string, unknown>
> {
  const redis = getRedis();
  if (!redis) return {};

  const entries = await redis.hgetall<Record<string, unknown>>(SUBSCRIPTIONS_KEY);
  return entries ?? {};
}

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  const entries = await readSubscriptionEntries();
  const subscriptions: StoredPushSubscription[] = [];

  for (const [field, value] of Object.entries(entries)) {
    const parsed = parseSubscriptionEntry(field, value);
    if (parsed) {
      subscriptions.push(parsed);
    }
  }

  return subscriptions;
}

export async function countRawSubscriptions(): Promise<number> {
  const entries = await readSubscriptionEntries();
  return Object.keys(entries).length;
}

export async function countValidSubscriptions(): Promise<number> {
  return (await listSubscriptions()).length;
}

export async function cleanupInvalidSubscriptions(): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;

  const entries = await readSubscriptionEntries();
  const invalidFields = Object.entries(entries)
    .filter(([field, value]) => !parseSubscriptionEntry(field, value))
    .map(([field]) => field);

  if (invalidFields.length === 0) return 0;

  for (let index = 0; index < invalidFields.length; index += 50) {
    const batch = invalidFields.slice(index, index + 50);
    await redis.hdel(SUBSCRIPTIONS_KEY, ...batch);
  }

  return invalidFields.length;
}
