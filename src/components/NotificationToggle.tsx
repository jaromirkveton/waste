import { usePushNotifications } from "../hooks/usePushNotifications";

export function NotificationToggle() {
  const { status, error, subscribe, unsubscribe } = usePushNotifications();

  const isSubscribed = status === "subscribed";
  const isLoading = status === "loading";
  const needsInstall = status === "needs-install";
  const isDisabled =
    isLoading || status === "denied" || status === "unsupported";

  const buttonLabel = isLoading
    ? "Ukládám…"
    : isSubscribed
      ? "Notifikace zapnuté"
      : "Zapnout notifikace";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={() => (isSubscribed ? unsubscribe() : subscribe())}
        disabled={isDisabled}
        className="text-body-sm-bold shrink-0 rounded-full border border-black/10 px-5 py-2.5 text-ink transition hover:bg-black/[0.04] disabled:opacity-50"
      >
        {buttonLabel}
      </button>

      {needsInstall && (
        <p className="text-body-sm max-w-xs text-right text-black/50">
          Na iPhone nejdřív přidejte stránku na plochu přes{" "}
          <span className="text-body-sm-bold text-ink">Sdílet → Přidat na plochu</span>,
          pak ji otevřete z ikony a znovu klepněte na tlačítko.
        </p>
      )}

      {status === "unsupported" && (
        <p className="text-body-sm max-w-xs text-right text-black/50">
          Váš prohlížeč nepodporuje webové notifikace.
        </p>
      )}

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
