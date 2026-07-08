import { getCurrentPushSubscription } from "./push-notifications";

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 60 * 1000;

async function ensureServerSubscription(): Promise<boolean> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return false;

  const response = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });

  return response.ok;
}

export async function syncBinCheckIfSubscribed(
  options: { force?: boolean } = {},
): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  const now = Date.now();
  if (!options.force && now - lastSyncAt < SYNC_COOLDOWN_MS) return;

  try {
    await ensureServerSubscription();
    await fetch("/api/check-bins", { method: "POST" });
    lastSyncAt = Date.now();
  } catch {
    // Best-effort background sync; ignore network errors.
  }
}
