import { Redis } from "@upstash/redis";
import type { BinSnapshot } from "../../shared/bin-snapshot.js";
import type { PushSubscriptionJSON } from "web-push";

const SUBSCRIPTIONS_KEY = "push:subscriptions";
const BIN_STATE_KEY = "bins:state";

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export function hasStorage(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function addSubscription(
  subscription: PushSubscriptionJSON,
): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");

  const id = subscription.endpoint;
  await redis.hset(SUBSCRIPTIONS_KEY, { [id]: JSON.stringify(subscription) });
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  await redis.hdel(SUBSCRIPTIONS_KEY, endpoint);
}

export async function listSubscriptions(): Promise<PushSubscriptionJSON[]> {
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
