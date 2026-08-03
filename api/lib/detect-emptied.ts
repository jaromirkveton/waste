import type { BinSnapshot } from "./storage";

/** Minimum percent drop from the previous reading to count as emptied. */
const SIGNIFICANT_DROP_PERCENT = 25;

/**
 * After notifying an emptying, ignore further drops until the bin has
 * refilled by at least this much above the emptied low. Prevents one
 * physical emptying (reported gradually across hourly checks) from
 * triggering multiple notifications.
 */
const REFILL_PERCENT = 20;

export interface EmptiedBin {
  containerId: number;
  trashType: string;
  previousPercent: number;
  currentPercent: number;
}

function mergeMissingPrevious(
  previous: BinSnapshot[],
  next: BinSnapshot[],
): BinSnapshot[] {
  const merged = [...next];

  for (const prev of previous) {
    const stillPresent = next.some(
      (bin) =>
        bin.containerId === prev.containerId || bin.trashType === prev.trashType,
    );
    if (!stillPresent) {
      merged.push(prev);
    }
  }

  return merged;
}

export function detectEmptiedBins(
  previous: BinSnapshot[],
  current: BinSnapshot[],
): { emptied: EmptiedBin[]; nextState: BinSnapshot[] } {
  const prevById = new Map(previous.map((bin) => [bin.containerId, bin]));
  const prevByType = new Map(previous.map((bin) => [bin.trashType, bin]));
  const emptied: EmptiedBin[] = [];
  const nextCurrent: BinSnapshot[] = [];

  for (const bin of current) {
    const prev = prevById.get(bin.containerId) ?? prevByType.get(bin.trashType);

    if (prev === undefined) {
      nextCurrent.push({ ...bin });
      continue;
    }

    if (prev.emptiedFloor !== undefined) {
      const floor = Math.min(prev.emptiedFloor, bin.percent);
      if (bin.percent >= floor + REFILL_PERCENT) {
        // Bin has refilled — arm for the next emptying.
        nextCurrent.push({
          containerId: bin.containerId,
          trashType: bin.trashType,
          percent: bin.percent,
        });
      } else {
        // Still settling after an emptying — update level, keep cooldown.
        nextCurrent.push({
          containerId: bin.containerId,
          trashType: bin.trashType,
          percent: bin.percent,
          emptiedFloor: floor,
        });
      }
      continue;
    }

    const drop = prev.percent - bin.percent;
    if (drop >= SIGNIFICANT_DROP_PERCENT) {
      emptied.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        previousPercent: prev.percent,
        currentPercent: bin.percent,
      });
      nextCurrent.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        percent: bin.percent,
        emptiedFloor: bin.percent,
      });
    } else {
      nextCurrent.push({
        containerId: bin.containerId,
        trashType: bin.trashType,
        percent: bin.percent,
      });
    }
  }

  return {
    emptied,
    nextState: mergeMissingPrevious(previous, nextCurrent),
  };
}
