import type { WeeklyHours, YearMonth } from './types';
/**
 * Hours in one person-month for an employee in a calendar month.
 * `person-month hours = weeklyHours × (workingDaysInMonth ÷ 5)`
 */
export declare function personMonthHours(weeklyHours: WeeklyHours, month: YearMonth): number;
/**
 * Hours represented by a canonical PM allocation in a given month.
 */
export declare function allocationHours(amountPm: number, weeklyHours: WeeklyHours, month: YearMonth): number;
