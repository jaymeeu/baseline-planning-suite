import type { IsoDate, YearMonth } from './types';
/**
 * Count Monday–Friday days in an inclusive date range.
 * Public holidays are ignored (weekends only).
 */
export declare function countWorkingDays(fromInclusive: IsoDate, toInclusive: IsoDate): number;
/** All Monday–Friday dates in the given calendar month, ascending. */
export declare function listWorkingDaysInMonth(month: YearMonth): IsoDate[];
export declare function countWorkingDaysInMonth(month: YearMonth): number;
