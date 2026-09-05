import { describe, expect, it } from 'vitest';
import type { Employee, RateRecord } from '../../packages/domain/src/index';
import {
  fromCanonical,
  toCanonical,
} from '../../packages/domain/src/index';
import {
  buildConversionContext,
  displayAmountForCell,
  formatDisplayValue,
  parseDisplayInput,
  reconcileColumnTotals,
} from '../../apps/delivery/src/deliveryHelpers';

const okafor: Employee = {
  id: 'emp-okafor',
  name: 'A. Okafor',
  role: 'Engineer',
  weeklyHours: 40,
};

const okaforRates: RateRecord[] = [
  {
    id: 'r1',
    employeeId: 'emp-okafor',
    validFrom: '2025-01-01',
    hourlyCost: 80,
  },
  {
    id: 'r2',
    employeeId: 'emp-okafor',
    validFrom: '2026-03-12',
    hourlyCost: 95,
  },
];

describe('staffing unit conversion helpers', () => {
  it('round-trips 0.5 PM through Hours / % / € for Okafor Mar 2026', () => {
    const ctx = buildConversionContext(okafor, '2026-03', okaforRates);
    expect(ctx.workingDaysInMonth).toBe(22);
    expect(ctx.costPerPersonMonth).toBeCloseTo(15760, 5);

    const hours = fromCanonical('Hours', 0.5, ctx);
    expect(hours).toBeCloseTo(88, 5);
    expect(toCanonical('Hours', hours, ctx)).toBeCloseTo(0.5, 10);

    const percent = fromCanonical('Percent', 0.5, ctx);
    expect(percent).toBeCloseTo(50, 5);
    expect(toCanonical('Percent', percent, ctx)).toBeCloseTo(0.5, 10);

    const cost = fromCanonical('Cost', 0.5, ctx);
    expect(cost).toBeCloseTo(7880, 5);
    expect(toCanonical('Cost', cost, ctx)).toBeCloseTo(0.5, 10);
  });

  it('formats and parses display input', () => {
    expect(formatDisplayValue('PM', 0.5)).toBe('0.50');
    expect(formatDisplayValue('Percent', 50)).toBe('50.0');
    expect(parseDisplayInput('')).toBe(0);
    expect(parseDisplayInput('1.25')).toBe(1.25);
    expect(parseDisplayInput('-1')).toBeUndefined();
  });

  it('reconciles column totals with largest remainder', () => {
    const parts = reconcileColumnTotals([1 / 3, 1 / 3, 1 / 3], 'PM');
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });

  it('builds display cell for leaf and parent', () => {
    const items = [
      { id: 'root', projectId: 'p1', parentId: null, name: 'Root' },
      { id: 'leaf', projectId: 'p1', parentId: 'root', name: 'Leaf' },
    ];
    const allocations = [
      {
        id: 'a1',
        breakdownItemId: 'leaf',
        employeeId: 'emp-okafor',
        month: '2026-03' as const,
        amount: 0.5,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const leaf = displayAmountForCell({
      items,
      allocations,
      breakdownItemId: 'leaf',
      employee: okafor,
      month: '2026-03',
      rates: okaforRates,
      unit: 'Cost',
    });
    expect(leaf.value).toBeCloseTo(7880, 5);
    expect(leaf.hasNoApplicableRate).toBe(false);

    const parent = displayAmountForCell({
      items,
      allocations,
      breakdownItemId: 'root',
      employee: okafor,
      month: '2026-03',
      rates: okaforRates,
      unit: 'PM',
    });
    expect(parent.amountPm).toBeCloseTo(0.5);
  });
});
