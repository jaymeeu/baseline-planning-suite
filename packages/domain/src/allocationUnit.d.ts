import type { DisplayUnit, WeeklyHours } from './types';
export interface UnitConversionContext {
    weeklyHours: WeeklyHours;
    /** Caller supplies working-day count (Phase 2 computes the calendar). */
    workingDaysInMonth: number;
    /** Required when converting to/from Cost: cost of 1.0 PM for that employee/month. */
    costPerPersonMonth?: number;
}
export declare class UnitConversionError extends Error {
    constructor(message: string);
}
/** Hours in one person-month for the given employee/month context. */
export declare function hoursPerPersonMonth(ctx: UnitConversionContext): number;
/**
 * Convert a display/edit value into canonical person-months.
 */
export declare function toCanonical(unit: DisplayUnit, displayValue: number, ctx: UnitConversionContext): number;
/**
 * Convert canonical person-months into a display/edit value for the given unit.
 */
export declare function fromCanonical(unit: DisplayUnit, amountPm: number, ctx: UnitConversionContext): number;
