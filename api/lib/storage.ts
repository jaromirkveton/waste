import { Redis } from "@upstash/redis";

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const BIN_STATE_KEY = "bins:state";

export interface BinSnapshot {
  containerId: number;
  trashType: string;
  percent: number;
  wasHigh: boolean;
}

export interface StoredPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

function getRedis(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  return new Redis({ url, token });
}

export function hasStorage(): boolean {
  return Boolean(getRedis());
}

export async function addSubscription(
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

export async function listSubscriptions(): Promise<StoredPushSubscription[]> {
  const redis = getRedis();
  if (!redis) return [];

  const entries = await redis.hgetall<Record<string, string>>(SUBSCRIPTIONS_KEY);
  if (!entries) return [];

  return Object.values(entries).map((value) => JSON.parse(value));
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
