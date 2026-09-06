import { describe, expect, it } from 'vitest';
import type { RateRecord } from '../../packages/domain/src/index';
import {
  calculateAllocationCost,
  countWorkingDays,
  findEffectiveRate,
  listWorkingDaysInMonth,
  personMonthHours,
} from '../../packages/domain/src/index';

const okaforRates: RateRecord[] = [
  {
    id: 'rate-80',
    employeeId: 'emp-001',
    validFrom: '2025-01-01',
    hourlyCost: 80,
  },
  {
    id: 'rate-95',
    employeeId: 'emp-001',
    validFrom: '2026-03-12',
    hourlyCost: 95,
  },
];

describe('effective rate lookup (cost suite)', () => {
  it('returns no rate before the first validFrom', () => {
    expect(findEffectiveRate(okaforRates, '2024-12-31')).toBeUndefined();
  });

  it('selects inclusive validFrom and keeps rate until the next change', () => {
    expect(findEffectiveRate(okaforRates, '2025-01-01')?.hourlyCost).toBe(80);
    expect(findEffectiveRate(okaforRates, '2026-03-11')?.hourlyCost).toBe(80);
    expect(findEffectiveRate(okaforRates, '2026-03-12')?.hourlyCost).toBe(95);
    expect(findEffectiveRate(okaforRates, '2026-03-13')?.hourlyCost).toBe(95);
  });
});

describe('reference calculation — A. Okafor March 2026', () => {
  it('matches the case-study numbers exactly', () => {
    const workingDays = listWorkingDaysInMonth('2026-03');
    expect(workingDays).toHaveLength(22);

    const beforeChange = workingDays.filter((d) => d < '2026-03-12');
    const fromChange = workingDays.filter((d) => d >= '2026-03-12');
    expect(beforeChange).toHaveLength(8);
    expect(fromChange).toHaveLength(14);
    expect(countWorkingDays('2026-03-01', '2026-03-11')).toBe(8);
    expect(countWorkingDays('2026-03-12', '2026-03-31')).toBe(14);

    expect(personMonthHours(40, '2026-03')).toBe(176);

    const result = calculateAllocationCost({
      amountPm: 0.5,
      weeklyHours: 40,
      month: '2026-03',
      rates: okaforRates,
    });

    expect(result.workingDays).toBe(22);
    expect(result.hours).toBe(88);
    expect(result.hours / result.workingDays).toBe(4);
    expect(result.capacityPercent).toBe(50);
    expect(result.hasNoApplicableRate).toBe(false);

    expect(result.slices).toHaveLength(2);
    expect(result.slices[0]?.workingDays).toBe(8);
    expect(result.slices[0]?.hourlyCost).toBe(80);
    expect(result.slices[0]?.cost).toBe(2560);
    expect(result.slices[1]?.workingDays).toBe(14);
    expect(result.slices[1]?.hourlyCost).toBe(95);
    expect(result.slices[1]?.cost).toBe(5320);

    expect(result.cost).toBe(7880);
    expect(result.blendedRatePerHour).toBeCloseTo(89.5455, 4);
  });
});

describe('mid-month and pre-rate cost behaviour', () => {
  it('prices a single-rate month with one slice', () => {
    const rates: RateRecord[] = [
      {
        id: 'r1',
        employeeId: 'e1',
        validFrom: '2025-01-01',
        hourlyCost: 80,
      },
    ];
    const result = calculateAllocationCost({
      amountPm: 0.5,
      weeklyHours: 40,
      month: '2026-02',
      rates,
    });
    expect(result.slices).toHaveLength(1);
    expect(result.hasNoApplicableRate).toBe(false);
    expect(result.cost).toBe(result.hours * 80);
  });

  it('marks pre-first-rate allocations as zero cost', () => {
    const rates: RateRecord[] = [
      {
        id: 'r-late',
        employeeId: 'e1',
        validFrom: '2026-04-01',
        hourlyCost: 100,
      },
    ];
    const result = calculateAllocationCost({
      amountPm: 0.5,
      weeklyHours: 40,
      month: '2026-03',
      rates,
    });
    expect(result.hours).toBe(88);
    expect(result.cost).toBe(0);
    expect(result.hasNoApplicableRate).toBe(true);
    expect(result.blendedRatePerHour).toBe(0);
    expect(result.slices.every((s) => s.hourlyCost === null)).toBe(true);
  });

  it('supports more than one rate change in a month', () => {
    const rates: RateRecord[] = [
      {
        id: 'a',
        employeeId: 'e1',
        validFrom: '2026-03-01',
        hourlyCost: 10,
      },
      {
        id: 'b',
        employeeId: 'e1',
        validFrom: '2026-03-10',
        hourlyCost: 20,
      },
      {
        id: 'c',
        employeeId: 'e1',
        validFrom: '2026-03-20',
        hourlyCost: 30,
      },
    ];
    const result = calculateAllocationCost({
      amountPm: 1,
      weeklyHours: 40,
      month: '2026-03',
      rates,
    });
    expect(result.slices.length).toBeGreaterThanOrEqual(3);
    expect(result.cost).toBeGreaterThan(0);
    expect(result.hasNoApplicableRate).toBe(false);
  });
});
