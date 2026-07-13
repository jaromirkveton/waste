/// <reference lib="webworker" />

import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event: PushEvent) => {
  const payload = event.data?.json() as { title?: string; body?: string } | undefined;
  const title = payload?.title ?? "Odpady Praha";
  const body = payload?.body ?? "Stav kontejneru se změnil";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/favicon.svg",
      badge: "/favicon.svg",
    }),
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow("/");
      }),
  );
});
