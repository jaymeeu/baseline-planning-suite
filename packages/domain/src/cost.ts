import { findEffectiveRate } from './rates';
import type { IsoDate, RateRecord, WeeklyHours, YearMonth } from './types';
import { allocationHours } from './personMonth';
import { listWorkingDaysInMonth } from './workingDays';

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

interface OpenSlice {
  from: IsoDate;
  to: IsoDate;
  workingDays: number;
  hourlyCost: number | null;
  rateId: string | null;
}

/**
 * Price a canonical PM allocation for one employee/month.
 * Effort is spread evenly across working days; mid-month rate changes
 * create working-day slices priced at the effective rate for each day.
 */
export function calculateAllocationCost(
  input: AllocationCostInput,
): AllocationCostResult {
  const workingDaysList = listWorkingDaysInMonth(input.month);
  const workingDays = workingDaysList.length;
  const hours = allocationHours(
    input.amountPm,
    input.weeklyHours,
    input.month,
  );
  const capacityPercent = input.amountPm * 100;

  if (workingDays === 0) {
    return {
      workingDays: 0,
      hours: 0,
      cost: 0,
      capacityPercent,
      blendedRatePerHour: undefined,
      hasNoApplicableRate: false,
      slices: [],
    };
  }

  const hoursPerDay = hours / workingDays;
  const openSlices: OpenSlice[] = [];
  let hasNoApplicableRate = false;

  for (const day of workingDaysList) {
    const rate = findEffectiveRate(input.rates, day);
    const hourlyCost = rate?.hourlyCost ?? null;
    const rateId = rate?.id ?? null;

    if (hourlyCost === null) {
      hasNoApplicableRate = true;
    }

    const last = openSlices[openSlices.length - 1];
    if (last && last.rateId === rateId && last.hourlyCost === hourlyCost) {
      last.to = day;
      last.workingDays += 1;
    } else {
      openSlices.push({
        from: day,
        to: day,
        workingDays: 1,
        hourlyCost,
        rateId,
      });
    }
  }

  const slices: CostSlice[] = openSlices.map((slice) => {
    const cost =
      slice.hourlyCost === null
        ? 0
        : slice.workingDays * hoursPerDay * slice.hourlyCost;
    return {
      from: slice.from,
      to: slice.to,
      workingDays: slice.workingDays,
      hourlyCost: slice.hourlyCost,
      cost,
    };
  });

  const cost = slices.reduce((sum, slice) => sum + slice.cost, 0);
  const blendedRatePerHour =
    hours > 0 && !Number.isNaN(cost) ? cost / hours : undefined;

  return {
    workingDays,
    hours,
    cost,
    capacityPercent,
    blendedRatePerHour,
    hasNoApplicableRate,
    slices,
  };
}
