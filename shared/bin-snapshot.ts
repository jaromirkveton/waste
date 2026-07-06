export interface BinSnapshot {
  containerId: number;
  trashType: string;
  percent: number;
}

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
  const prevById = new Map(previous.map((bin) => [bin.containerId, bin]));
  const prevByType = new Map(previous.map((bin) => [bin.trashType, bin]));
  const emptied: EmptiedBin[] = [];

  const nextState: BinSnapshot[] = current.map((bin) => {
    const prev = prevById.get(bin.containerId) ?? prevByType.get(bin.trashType);

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
