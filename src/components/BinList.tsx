import { BinCard } from "./BinCard";
import type { BinDisplayItem } from "../types";

interface BinListProps {
  bins: BinDisplayItem[];
  isLoading: boolean;
  error: Error | null;
  isRefreshing?: boolean;
  refreshAnimationKey?: number;
}

export function BinList({
  bins,
  isLoading,
  error,
  isRefreshing = false,
  refreshAnimationKey = 0,
}: BinListProps) {
  if (isLoading) {
    return (
      <div className="w-full rounded-[24px] bg-white p-8 text-center text-body-sm text-black/50 shadow-[0px_6px_16px_-2px_rgba(0,0,0,0.08)]">
        Načítám kontejnery…
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-[24px] bg-red-50 p-6 text-center text-body text-red-700">
        {error.message}
      </div>
    );
  }

  if (bins.length === 0) {
    return (
      <div className="w-full rounded-[24px] bg-white p-8 text-center text-body-sm text-black/50 shadow-[0px_6px_16px_-2px_rgba(0,0,0,0.08)]">
        V okolí vaší adresy nebylo nalezeno žádné stanoviště s kontejnery.
      </div>
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-4">
      {bins.map((bin, index) => {
        const animationClass =
          refreshAnimationKey > 0 && !isRefreshing
            ? "animate-card-refresh"
            : refreshAnimationKey === 0
              ? "animate-card-in"
              : undefined;

        return (
          <div
            key={`${bin.container_id}-r${refreshAnimationKey}`}
            className={animationClass}
            style={animationClass ? { animationDelay: `${index * 70}ms` } : undefined}
          >
            <BinCard bin={bin} isUpdating={isRefreshing} />
          </div>
        );
      })}
    </div>
  );
}
