import { describe, expect, it } from 'vitest';
import {
  countWorkingDays,
  countWorkingDaysInMonth,
  listWorkingDaysInMonth,
} from '../../packages/domain/src/index';

describe('working days', () => {
  it('counts March 2026 as 22 working days', () => {
    expect(countWorkingDaysInMonth('2026-03')).toBe(22);
    expect(listWorkingDaysInMonth('2026-03')).toHaveLength(22);
  });

  it('excludes weekends from inclusive ranges', () => {
    // Fri 2026-03-06 through Mon 2026-03-09 → Fri + Mon = 2
    expect(countWorkingDays('2026-03-06', '2026-03-09')).toBe(2);
  });

  it('handles month boundaries', () => {
    // Last weekday of Feb 2026 is Fri 27; Mar 1 is Sunday → Mar 2 Monday
    expect(countWorkingDays('2026-02-27', '2026-03-02')).toBe(2);
  });

  it('returns 0 when the range is inverted', () => {
    expect(countWorkingDays('2026-03-10', '2026-03-01')).toBe(0);
  });

  it('lists only weekdays for February 2026', () => {
    const days = listWorkingDaysInMonth('2026-02');
    expect(countWorkingDaysInMonth('2026-02')).toBe(20);
    expect(days[0]).toBe('2026-02-02');
    expect(days[days.length - 1]).toBe('2026-02-27');
  });
});
