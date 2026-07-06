import { getCurrentPushSubscription } from "./push-notifications";

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

export async function syncBinCheckIfSubscribed(): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  const now = Date.now();
  if (now - lastSyncAt < SYNC_COOLDOWN_MS) return;
  lastSyncAt = now;

  try {
    await fetch("/api/check-bins", { method: "POST" });
  } catch {
    // Best-effort background sync; ignore network errors.
  }
}
