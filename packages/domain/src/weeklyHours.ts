import type { WeeklyHours } from './types';

const ALLOWED_WEEKLY_HOURS: readonly WeeklyHours[] = [40, 32, 20];

export function isWeeklyHours(value: number): value is WeeklyHours {
  return (ALLOWED_WEEKLY_HOURS as readonly number[]).includes(value);
}

export function assertWeeklyHours(value: number): WeeklyHours {
  if (!isWeeklyHours(value)) {
    throw new Error(`weeklyHours must be 40, 32, or 20; received ${value}`);
  }
  return value;
}

export function allowedWeeklyHours(): readonly WeeklyHours[] {
  return ALLOWED_WEEKLY_HOURS;
}
