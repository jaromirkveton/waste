import type { BinSnapshot } from "./storage";

export interface EmptiedBin {
  containerId: number;
  trashType: string;
  previousPercent: number;
  currentPercent: number;
}

export function detectEmptiedBins(
  previous: BinSnapshot[],
  current: BinSnapshot[],
): { emptied: EmptiedBin[]; nextState: BinSnapshot[] } {
  const prevMap = new Map(previous.map((bin) => [bin.containerId, bin]));
  const emptied: EmptiedBin[] = [];

  const nextState: BinSnapshot[] = current.map((bin) => {
    const prev = prevMap.get(bin.containerId);

    if (prev !== undefined && bin.percent < prev.percent) {
      emptied.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        previousPercent: prev.percent,
        currentPercent: bin.percent,
      });
    }

    return bin;
  });

  return { emptied, nextState };
}
