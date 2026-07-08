import type { BinSnapshot } from "./storage";

export interface EmptiedBin {
  containerId: number;
  trashType: string;
  previousPercent: number;
  currentPercent: number;
}

function mergeNextState(
  previous: BinSnapshot[],
  current: BinSnapshot[],
): BinSnapshot[] {
  const next = [...current];

  for (const prev of previous) {
    const stillPresent = current.some(
      (bin) =>
        bin.containerId === prev.containerId || bin.trashType === prev.trashType,
    );
    if (!stillPresent) {
      next.push(prev);
    }
  }

  return next;
}

export function detectEmptiedBins(
  previous: BinSnapshot[],
  current: BinSnapshot[],
): { emptied: EmptiedBin[]; nextState: BinSnapshot[] } {
  const prevById = new Map(previous.map((bin) => [bin.containerId, bin]));
  const prevByType = new Map(previous.map((bin) => [bin.trashType, bin]));
  const emptied: EmptiedBin[] = [];

  for (const bin of current) {
    const prev = prevById.get(bin.containerId) ?? prevByType.get(bin.trashType);

    if (prev !== undefined && bin.percent < prev.percent) {
      emptied.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        previousPercent: prev.percent,
        currentPercent: bin.percent,
      });
    }
  }

  return {
    emptied,
    nextState: mergeNextState(previous, current),
  };
}
