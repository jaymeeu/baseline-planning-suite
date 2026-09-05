import type { IsoDate, YearMonth } from './types';

function parseIsoDate(iso: IsoDate): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseYearMonth(month: YearMonth): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error(`Invalid year-month: ${month}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
  };
}

function formatIsoDate(year: number, month: number, day: number): IsoDate {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/** UTC day-of-week: 0 = Sunday … 6 = Saturday. */
function utcDayOfWeek(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function isWeekday(year: number, month: number, day: number): boolean {
  const dow = utcDayOfWeek(year, month, day);
  return dow >= 1 && dow <= 5;
}

function daysInCalendarMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toOrdinal(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * Count Monday–Friday days in an inclusive date range.
 * Public holidays are ignored (weekends only).
 */
export function countWorkingDays(
  fromInclusive: IsoDate,
  toInclusive: IsoDate,
): number {
  const from = parseIsoDate(fromInclusive);
  const to = parseIsoDate(toInclusive);
  const start = toOrdinal(from.year, from.month, from.day);
  const end = toOrdinal(to.year, to.month, to.day);

  if (end < start) {
    return 0;
  }

  let count = 0;
  for (let ordinal = start; ordinal <= end; ordinal += 1) {
    const date = new Date(ordinal * 86_400_000);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    if (isWeekday(year, month, day)) {
      count += 1;
    }
  }
  return count;
}

/** All Monday–Friday dates in the given calendar month, ascending. */
export function listWorkingDaysInMonth(month: YearMonth): IsoDate[] {
  const { year, month: monthNumber } = parseYearMonth(month);
  const lastDay = daysInCalendarMonth(year, monthNumber);
  const days: IsoDate[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    if (isWeekday(year, monthNumber, day)) {
      days.push(formatIsoDate(year, monthNumber, day));
    }
  }

  return days;
}

export function countWorkingDaysInMonth(month: YearMonth): number {
  return listWorkingDaysInMonth(month).length;
}
