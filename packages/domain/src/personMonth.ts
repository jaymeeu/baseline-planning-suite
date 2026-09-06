import { hoursPerPersonMonth } from './allocationUnit';
import type { WeeklyHours, YearMonth } from './types';
import { countWorkingDaysInMonth } from './workingDays';

/**
 * Hours in one person-month for an employee in a calendar month.
 * `person-month hours = weeklyHours × (workingDaysInMonth ÷ 5)`
 */
export function personMonthHours(
  weeklyHours: WeeklyHours,
  month: YearMonth,
): number {
  return hoursPerPersonMonth({
    weeklyHours,
    workingDaysInMonth: countWorkingDaysInMonth(month),
  });
}

/**
 * Hours represented by a canonical PM allocation in a given month.
 */
export function allocationHours(
  amountPm: number,
  weeklyHours: WeeklyHours,
  month: YearMonth,
): number {
  return amountPm * personMonthHours(weeklyHours, month);
}
