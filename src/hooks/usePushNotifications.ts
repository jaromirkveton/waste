import { useCallback, useEffect, useState } from "react";
import {
  getCurrentPushSubscription,
  getIosInstallHint,
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
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }

    if (getIosInstallHint()) {
      setStatus("needs-install");
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
      if (Notification.permission === "denied") {
        setStatus("denied");
      } else if (getIosInstallHint()) {
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
