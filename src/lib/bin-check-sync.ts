import { getCurrentPushSubscription, registerServerSubscription } from "./push-notifications";

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 60 * 1000;

export async function syncBinCheckIfSubscribed(
  options: { force?: boolean } = {},
): Promise<void> {
  const subscription = await getCurrentPushSubscription();
  if (!subscription) return;

  const now = Date.now();
  if (!options.force && now - lastSyncAt < SYNC_COOLDOWN_MS) return;

  try {
    await registerServerSubscription();
    await fetch("/api/check-bins", { method: "POST" });
    lastSyncAt = Date.now();
  } catch {
    // Best-effort backup when the app is opened.
  }
}
