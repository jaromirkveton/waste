import { useCallback, useEffect, useState } from "react";
import {
  getCurrentPushSubscription,
  getIosInstallHint,
  isIosDevice,
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "../lib/push-notifications";

type NotificationStatus =
  | "unsupported"
  | "needs-install"
  | "idle"
  | "subscribed"
  | "denied"
  | "loading"
  | "error";

export function usePushNotifications() {
  const [status, setStatus] = useState<NotificationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (getIosInstallHint() || (isIosDevice() && !isStandalonePushAvailable())) {
      setStatus("needs-install");
      return;
    }

    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    const subscription = await getCurrentPushSubscription();
    setStatus(subscription ? "subscribed" : "idle");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      await subscribeToPushNotifications();
      setStatus("subscribed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se povolit notifikace.");
      await refresh();
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setStatus("denied");
      } else if (getIosInstallHint() || isIosDevice()) {
        setStatus("needs-install");
      } else {
        setStatus("error");
      }
    }
  }, [refresh]);

  const unsubscribe = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      await unsubscribeFromPushNotifications();
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se vypnout notifikace.");
      setStatus("error");
    }
  }, []);

  return {
    status,
    error,
    subscribe,
    unsubscribe,
    refresh,
  };
}

function isStandalonePushAvailable(): boolean {
  return isPushSupported() && !getIosInstallHint();
}
