import webpush from "web-push";
import type { PushSubscriptionJSON } from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("Missing VAPID configuration");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: { title: string; body: string },
): Promise<void> {
  ensureConfigured();
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

export async function sendEmptiedNotifications(
  subscriptions: PushSubscriptionJSON[],
  bins: Array<{ trashType: string; currentPercent: number }>,
): Promise<{ sent: number; failed: number }> {
  if (subscriptions.length === 0 || bins.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const body =
    bins.length === 1
      ? `${bins[0].trashType} — nyní ${bins[0].currentPercent} %`
      : bins.map((bin) => `${bin.trashType} (${bin.currentPercent} %)`).join(", ");

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await sendPushNotification(subscription, {
        title: bins.length === 1 ? "Kontejner vyvezen" : "Kontejnery vyvezeny",
        body,
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { sent, failed };
}
