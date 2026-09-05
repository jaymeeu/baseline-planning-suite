import type { IsoDate, RateRecord } from './types';
/**
 * Sort rates ascending by validFrom (stable for equal dates by id).
 * Rates have no end date; ordering defines the effective timeline.
 */
export declare function sortRatesByValidFrom(rates: readonly RateRecord[]): RateRecord[];
/**
 * Latest rate whose validFrom is on or before `date` (inclusive).
 * Returns undefined when `date` is before the employee's first rate.
 */
export declare function findEffectiveRate(rates: readonly RateRecord[], date: IsoDate): RateRecord | undefined;
