import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BinList } from "./components/BinList";
import { NotificationToggle } from "./components/NotificationToggle";
import { useBins } from "./hooks/useBins";
import { FIXED_ADDRESS } from "./services/api";

const queryClient = new QueryClient();

function AppContent() {
  const {
    data: bins = [],
    isLoading,
    error,
    refresh,
    isRefreshing,
    refreshAnimationKey,
  } = useBins();

  return (
    <main className="mx-auto flex min-h-screen max-w-[1100px] flex-col px-6 pb-8">
      <header className="mb-8 flex shrink-0 items-start justify-between gap-4 pt-8">
        <div>
          <p className="text-body-sm text-black/50">Vaše sběrné místo</p>
          <h1 className="text-headline-h2 mt-1 text-ink">
            {FIXED_ADDRESS.formattedAddress}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isRefreshing}
            className="text-body-sm-bold shrink-0 rounded-full bg-black/[0.08] px-5 py-2.5 text-ink transition hover:bg-black/[0.12] disabled:opacity-50"
          >
            {isRefreshing ? "Aktualizuji…" : "Aktualizovat"}
          </button>
          <NotificationToggle />
        </div>
      </header>

      <div className="flex flex-1 items-center">
        <BinList
          bins={bins}
          isLoading={isLoading}
          error={error}
          isRefreshing={isRefreshing}
          refreshAnimationKey={refreshAnimationKey}
        />
      </div>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
