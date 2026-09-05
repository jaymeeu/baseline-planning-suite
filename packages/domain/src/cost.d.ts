import type { IsoDate, RateRecord, WeeklyHours, YearMonth } from './types';
export interface AllocationCostInput {
    amountPm: number;
    weeklyHours: WeeklyHours;
    month: YearMonth;
    rates: readonly RateRecord[];
}
export interface CostSlice {
    from: IsoDate;
    to: IsoDate;
    workingDays: number;
    /** null when no rate applies for this slice. */
    hourlyCost: number | null;
    cost: number;
}
export interface AllocationCostResult {
    workingDays: number;
    hours: number;
    cost: number;
    capacityPercent: number;
    blendedRatePerHour: number | undefined;
    hasNoApplicableRate: boolean;
    slices: readonly CostSlice[];
}
/**
 * Price a canonical PM allocation for one employee/month.
 * Effort is spread evenly across working days; mid-month rate changes
 * create working-day slices priced at the effective rate for each day.
 */
export declare function calculateAllocationCost(input: AllocationCostInput): AllocationCostResult;
