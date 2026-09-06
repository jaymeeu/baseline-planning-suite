import { describe, expect, it } from 'vitest';
import {
  formatYearMonthLabel,
  newBreakdownItemId,
  newProjectId,
  validateBreakdownName,
  validateProjectInput,
} from '../../apps/delivery/src/deliveryHelpers';

describe('deliveryHelpers', () => {
  it('generates project and wbs ids with stable prefixes', () => {
    expect(newProjectId().startsWith('proj-user-')).toBe(true);
    expect(newBreakdownItemId().startsWith('wbs-user-')).toBe(true);
  });

  it('formats year-month headers as MMM YYYY', () => {
    expect(formatYearMonthLabel('2026-01')).toBe('Jan 2026');
    expect(formatYearMonthLabel('2026-03')).toBe('Mar 2026');
    expect(formatYearMonthLabel('2026-12')).toBe('Dec 2026');
  });

  it('validates project input', () => {
    expect(
      validateProjectInput({
        name: 'Alpha',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).toBeUndefined();
    expect(
      validateProjectInput({
        name: ' ',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }),
    ).toMatch(/name/i);
    expect(
      validateProjectInput({
        name: 'Alpha',
        startDate: '2026-12-31',
        endDate: '2026-01-01',
      }),
    ).toMatch(/startDate/);
  });

  it('validates breakdown names', () => {
    expect(validateBreakdownName('Stream')).toBeUndefined();
    expect(validateBreakdownName('  ')).toMatch(/name/i);
  });
});
