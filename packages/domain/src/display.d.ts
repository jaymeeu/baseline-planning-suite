import type { DisplayUnit, YearMonth } from './types';
/** Display decimal places by unit. */
export declare function displayDecimals(unit: DisplayUnit): number;
/** Display label for a canonical `YYYY-MM` month, e.g. `Jan 2026`. */
export declare function formatYearMonthLabel(month: YearMonth): string;
/**
 * Round a single value for display (does not reconcile totals).
 */
export declare function roundForDisplay(unit: DisplayUnit, value: number): number;
/**
 * Largest-remainder distribution so rounded parts sum exactly to the rounded total
 * at the given decimal scale. Values may be negative; remainders use absolute
 * fractional parts with sign preserved on floors.
 */
export declare function distributeLargestRemainder(values: readonly number[], decimals: number): number[];
