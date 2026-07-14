import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchNearbyStations, FIXED_ADDRESS, stationsToBins } from "../services/api";

/** Half of card-shimmer-sweep duration in index.css (1.8s) */
const MIN_SHIMMER_MS = 900;

export function useBins() {
  const query = useQuery({
    queryKey: ["bins", FIXED_ADDRESS.lat, FIXED_ADDRESS.lng],
    queryFn: async () => {
      const stations = await fetchNearbyStations(FIXED_ADDRESS);
      return stationsToBins(stations);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { refetch, isRefetching, data } = query;
  const [isManualRefresh, setIsManualRefresh] = useState(false);
  const [refreshAnimationKey, setRefreshAnimationKey] = useState(0);

  const refresh = useCallback(async () => {
    setIsManualRefresh(true);
    try {
      const [result] = await Promise.all([
        refetch(),
        new Promise<void>((resolve) => setTimeout(resolve, MIN_SHIMMER_MS)),
      ]);
      if (!result.error) {
        setRefreshAnimationKey((key) => key + 1);
      }
    } finally {
      setIsManualRefresh(false);
    }
  }, [refetch]);

  const isRefreshing =
    isManualRefresh || (isRefetching && data !== undefined);

  return {
    ...query,
    refresh,
    isRefreshing,
    refreshAnimationKey,
  };
}
