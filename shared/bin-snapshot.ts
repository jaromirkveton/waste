export interface BinSnapshot {
  containerId: number;
  trashType: string;
  percent: number;
}

/** Minimum percent drop from the previous reading to count as emptied. */
const SIGNIFICANT_DROP_PERCENT = 25;

/** Bins above this level are not considered emptied even after a large drop. */
const EMPTIED_MAX_PERCENT = 35;

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

    if (prev !== undefined) {
      const drop = prev.percent - bin.percent;
      if (drop >= SIGNIFICANT_DROP_PERCENT && bin.percent <= EMPTIED_MAX_PERCENT) {
        emptied.push({
          containerId: bin.containerId,
          trashType: bin.trashType,
          previousPercent: prev.percent,
          currentPercent: bin.percent,
        });
      }
    }
  }

  return {
    emptied,
    nextState: mergeNextState(previous, current),
  };
}
