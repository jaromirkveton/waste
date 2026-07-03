import type { BinSnapshot } from "./storage";

export interface EmptiedBin {
  containerId: number;
  trashType: string;
  previousPercent: number;
  currentPercent: number;
}

export function detectEmptiedBins(
  previous: BinSnapshot[],
  current: Omit<BinSnapshot, "wasHigh">[],
): { emptied: EmptiedBin[]; nextState: BinSnapshot[] } {
  const prevMap = new Map(previous.map((bin) => [bin.containerId, bin]));
  const emptied: EmptiedBin[] = [];

  const nextState: BinSnapshot[] = current.map((bin) => {
    const prev = prevMap.get(bin.containerId);
    const wasHigh = bin.percent >= 40 || (prev?.wasHigh ?? false);
    const significantDrop =
      prev !== undefined && prev.percent - bin.percent >= 25 && bin.percent <= 35;

    if (wasHigh && significantDrop) {
      emptied.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        previousPercent: prev!.percent,
        currentPercent: bin.percent,
      });
    }

    return {
      ...bin,
      wasHigh: significantDrop ? false : wasHigh,
    };
  });

  return { emptied, nextState };
}
