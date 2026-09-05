import type { IsoDate, RateRecord } from './types';

/**
 * Sort rates ascending by validFrom (stable for equal dates by id).
 * Rates have no end date; ordering defines the effective timeline.
 */
export function sortRatesByValidFrom(rates: readonly RateRecord[]): RateRecord[] {
  return [...rates].sort((a, b) => {
    if (a.validFrom < b.validFrom) return -1;
    if (a.validFrom > b.validFrom) return 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/**
 * Latest rate whose validFrom is on or before `date` (inclusive).
 * Returns undefined when `date` is before the employee's first rate.
 */
export function findEffectiveRate(
  rates: readonly RateRecord[],
  date: IsoDate,
): RateRecord | undefined {
  const sorted = sortRatesByValidFrom(rates);
  let effective: RateRecord | undefined;

  for (const rate of sorted) {
    if (rate.validFrom <= date) {
      effective = rate;
    } else {
      break;
    }
  }

  return effective;
}
