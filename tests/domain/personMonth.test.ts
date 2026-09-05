import { describe, expect, it } from 'vitest';
import {
  allocationHours,
  personMonthHours,
} from '../../packages/domain/src/index';

describe('person-month hours', () => {
  it('supports 40h, 32h, and 20h for March 2026 (22 working days)', () => {
    expect(personMonthHours(40, '2026-03')).toBe(176);
    expect(personMonthHours(32, '2026-03')).toBe(140.8);
    expect(personMonthHours(20, '2026-03')).toBe(88);
  });

  it('scales allocation hours by person-months', () => {
    expect(allocationHours(0.5, 40, '2026-03')).toBe(88);
    expect(allocationHours(1, 40, '2026-03')).toBe(176);
  });
});
