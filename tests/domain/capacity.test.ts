import { describe, expect, it } from 'vitest';
import type { CapacityAllocation } from '../../packages/domain/src/index';
import {
  canEditAllocationWhenOverCapacity,
  summarizeAllCapacities,
  summarizeEmployeeMonthCapacity,
} from '../../packages/domain/src/index';

function alloc(
  partial: Omit<CapacityAllocation, 'employeeId' | 'month'> & {
    employeeId?: string;
    month?: string;
  },
): CapacityAllocation {
  return {
    employeeId: 'emp-1',
    month: '2026-03',
    ...partial,
  };
}

describe('capacity aggregation', () => {
  it('sums below capacity across projects', () => {
    const allocations = [
      alloc({
        id: 'a1',
        breakdownItemId: 'wbs-proj-a',
        amount: 0.4,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'a2',
        breakdownItemId: 'wbs-proj-b',
        amount: 0.4,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.totalPm).toBe(0.8);
    expect(summary.capacityPercent).toBe(80);
    expect(summary.isOverCapacity).toBe(false);
    expect(summary.causingAllocationId).toBeUndefined();
    expect(summary.allocationIds).toEqual(['a1', 'a2']);
  });

  it('treats exactly 1.0 PM as at capacity, not over', () => {
    const allocations = [
      alloc({
        id: 'a1',
        breakdownItemId: 'wbs-1',
        amount: 1,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.totalPm).toBe(1);
    expect(summary.capacityPercent).toBe(100);
    expect(summary.isOverCapacity).toBe(false);
  });

  it('detects overcapacity above 100%', () => {
    const allocations = [
      alloc({
        id: 'a1',
        breakdownItemId: 'wbs-proj-a',
        amount: 0.6,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'a2',
        breakdownItemId: 'wbs-proj-b',
        amount: 0.6,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.totalPm).toBeCloseTo(1.2);
    expect(summary.capacityPercent).toBeCloseTo(120);
    expect(summary.isOverCapacity).toBe(true);
  });
});

describe('overcapacity cause', () => {
  it('identifies the most recently edited contributing allocation', () => {
    const allocations = [
      alloc({
        id: 'older',
        breakdownItemId: 'wbs-a',
        amount: 0.6,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'newer',
        breakdownItemId: 'wbs-b',
        amount: 0.6,
        updatedAt: '2026-01-03T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.isOverCapacity).toBe(true);
    expect(summary.causingAllocationId).toBe('newer');
  });

  it('ignores zero-amount rows when choosing the cause', () => {
    const allocations = [
      alloc({
        id: 'zero-latest',
        breakdownItemId: 'wbs-a',
        amount: 0,
        updatedAt: '2026-01-05T10:00:00.000Z',
      }),
      alloc({
        id: 'real-older',
        breakdownItemId: 'wbs-b',
        amount: 0.7,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'real-newer',
        breakdownItemId: 'wbs-c',
        amount: 0.5,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.isOverCapacity).toBe(true);
    expect(summary.causingAllocationId).toBe('real-newer');
  });

  it('tie-breaks equal updatedAt by allocation id', () => {
    const allocations = [
      alloc({
        id: 'b-id',
        breakdownItemId: 'wbs-a',
        amount: 0.6,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'a-id',
        breakdownItemId: 'wbs-b',
        amount: 0.6,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
    ];

    const summary = summarizeEmployeeMonthCapacity(
      allocations,
      'emp-1',
      '2026-03',
    );

    expect(summary.causingAllocationId).toBe('a-id');
  });
});

describe('capacity helpers', () => {
  it('summarizes all employee/month keys', () => {
    const allocations = [
      alloc({
        id: 'a1',
        employeeId: 'emp-1',
        month: '2026-03',
        breakdownItemId: 'wbs-1',
        amount: 0.5,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'a2',
        employeeId: 'emp-2',
        month: '2026-03',
        breakdownItemId: 'wbs-2',
        amount: 1.2,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ];

    const all = summarizeAllCapacities(allocations);
    expect(all).toHaveLength(2);
    expect(all.find((row) => row.employeeId === 'emp-2')?.isOverCapacity).toBe(
      true,
    );
  });

  it('never blocks edits when over capacity', () => {
    expect(canEditAllocationWhenOverCapacity()).toBe(true);

    const allocations = [
      alloc({
        id: 'a1',
        breakdownItemId: 'wbs-a',
        amount: 0.8,
        updatedAt: '2026-01-01T10:00:00.000Z',
      }),
      alloc({
        id: 'a2',
        breakdownItemId: 'wbs-b',
        amount: 0.8,
        updatedAt: '2026-01-02T10:00:00.000Z',
      }),
    ];

    expect(() =>
      summarizeEmployeeMonthCapacity(allocations, 'emp-1', '2026-03'),
    ).not.toThrow();
    expect(
      summarizeEmployeeMonthCapacity(allocations, 'emp-1', '2026-03')
        .isOverCapacity,
    ).toBe(true);
    expect(canEditAllocationWhenOverCapacity()).toBe(true);
  });
});
