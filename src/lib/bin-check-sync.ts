import { getCurrentPushSubscription, registerServerSubscription } from "./push-notifications";

let lastSyncAt = 0;
const SYNC_COOLDOWN_MS = 60 * 1000;

export async function registerPeriodicBinCheck(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!("periodicSync" in registration)) return;

    const periodicSync = registration.periodicSync as {
      register: (tag: string, options: { minInterval: number }) => Promise<void>;
    };

    await periodicSync.register("check-bins", {
      minInterval: 60 * 60 * 1000,
    });
  } catch {
    // Unsupported or permission denied.
  }
}

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
    // Best-effort background sync; ignore network errors.
  }
}
