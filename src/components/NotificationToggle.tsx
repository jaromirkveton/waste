import { usePushNotifications } from "../hooks/usePushNotifications";

export function NotificationToggle() {
  const { status, error, subscribe, unsubscribe } = usePushNotifications();

  if (status === "unsupported") {
    return null;
  }

  if (status === "needs-install") {
    return (
      <p className="text-body-sm max-w-xs text-right text-black/50">
        Pro notifikace na iPhone nejdřív přidejte stránku na plochu přes{" "}
        <span className="text-body-sm-bold text-ink">Sdílet → Přidat na plochu</span>.
      </p>
    );
  }

  const isSubscribed = status === "subscribed";
  const isLoading = status === "loading";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
        disabled={isLoading || status === "denied"}
        className="text-body-sm-bold shrink-0 rounded-full border border-black/10 px-5 py-2.5 text-ink transition hover:bg-black/[0.04] disabled:opacity-50"
      >
        {isLoading
          ? "Ukládám…"
          : isSubscribed
            ? "Notifikace zapnuté"
            : "Zapnout notifikace"}
      </button>
      {status === "denied" && (
        <p className="text-body-sm max-w-xs text-right text-black/50">
          Notifikace jsou v prohlížeči zablokované. Povolte je v nastavení.
        </p>
      )}
      {error && (
        <p className="text-body-sm max-w-xs text-right text-red-600">{error}</p>
      )}
      {isSubscribed && (
        <p className="text-body-sm max-w-xs text-right text-black/50">
          Pošleme upozornění, když je kontejner vyvezen.
        </p>
      )}
    </div>
  );
}
