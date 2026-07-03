import { Redis } from "@upstash/redis";

export type RedisConfigError =
  | "missing"
  | "invalid_url";

export function getRedisConfigError(): RedisConfigError | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) return "missing";
  if (!url.startsWith("https://")) return "invalid_url";
  return null;
}

export function getRedisConfigErrorMessage(error: RedisConfigError): string {
  if (error === "missing") {
    return "Redis není nakonfigurovaný. Ve Vercelu přidejte Upstash Redis integraci.";
  }

  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";

  return `Redis URL není platná (musí začínat https://). Ve Vercelu opravte UPSTASH_REDIS_REST_URL — aktuálně: "${url}". Hodnotu najdete v Upstash konzoli u databáze jako REST URL.`;
}

export function getRedis(): Redis | null {
  const configError = getRedisConfigError();
  if (configError) return null;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL!;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN!;

  return new Redis({ url, token });
}
