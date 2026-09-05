import { describe, expect, it } from 'vitest';
import type { BreakdownItem, RateRecord } from '../../packages/domain/src/index';
import {
  assertAllocationTargetIsLeaf,
  assertCanInsertChild,
  assertId,
  assertWeeklyHours,
  findEffectiveRate,
  getBreakdownDepth,
  hasChildren,
  isLeaf,
  isWeeklyHours,
  sortRatesByValidFrom,
} from '../../packages/domain/src/index';

describe('weeklyHours invariants', () => {
  it('accepts 40, 32, and 20', () => {
    expect(isWeeklyHours(40)).toBe(true);
    expect(isWeeklyHours(32)).toBe(true);
    expect(isWeeklyHours(20)).toBe(true);
    expect(assertWeeklyHours(32)).toBe(32);
  });

  it('rejects other values', () => {
    expect(isWeeklyHours(35)).toBe(false);
    expect(() => assertWeeklyHours(35)).toThrow(/weeklyHours/);
  });
});

describe('id invariants', () => {
  it('requires non-empty string ids', () => {
    expect(assertId('emp-1')).toBe('emp-1');
    expect(() => assertId('')).toThrow();
    expect(() => assertId(null)).toThrow();
  });
});

describe('effective-dated rates', () => {
  const rates: RateRecord[] = [
    {
      id: 'r2',
      employeeId: 'emp-1',
      validFrom: '2026-03-12',
      hourlyCost: 95,
    },
    {
      id: 'r1',
      employeeId: 'emp-1',
      validFrom: '2025-01-01',
      hourlyCost: 80,
    },
  ];

  it('sorts by validFrom ascending', () => {
    const sorted = sortRatesByValidFrom(rates);
    expect(sorted.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('returns undefined before the first rate', () => {
    expect(findEffectiveRate(rates, '2024-12-31')).toBeUndefined();
  });

  it('selects the rate on its validFrom day (inclusive)', () => {
    expect(findEffectiveRate(rates, '2025-01-01')?.hourlyCost).toBe(80);
    expect(findEffectiveRate(rates, '2026-03-12')?.hourlyCost).toBe(95);
  });

  it('keeps the previous rate until the next validFrom', () => {
    expect(findEffectiveRate(rates, '2026-03-11')?.hourlyCost).toBe(80);
    expect(findEffectiveRate(rates, '2026-03-13')?.hourlyCost).toBe(95);
  });
});

describe('WBS invariants', () => {
  const items: BreakdownItem[] = [
    { id: 'root', projectId: 'p1', parentId: null, name: 'Root' },
    { id: 'l2', projectId: 'p1', parentId: 'root', name: 'Level 2' },
    { id: 'l3', projectId: 'p1', parentId: 'l2', name: 'Level 3' },
  ];

  it('computes depth with root = 1', () => {
    expect(getBreakdownDepth(items, 'root')).toBe(1);
    expect(getBreakdownDepth(items, 'l2')).toBe(2);
    expect(getBreakdownDepth(items, 'l3')).toBe(3);
  });

  it('identifies leaves and parents', () => {
    expect(isLeaf(items, 'l3')).toBe(true);
    expect(isLeaf(items, 'root')).toBe(false);
    expect(hasChildren(items, 'root')).toBe(true);
    expect(() => assertAllocationTargetIsLeaf(items, 'root')).toThrow(/leaf/);
    expect(() => assertAllocationTargetIsLeaf(items, 'l3')).not.toThrow();
  });

  it('allows children under depth-2 parents and rejects depth 4', () => {
    expect(() => assertCanInsertChild(items, 'root')).not.toThrow();
    expect(() => assertCanInsertChild(items, 'l2')).not.toThrow();
    expect(() => assertCanInsertChild(items, 'l3')).toThrow(/depth/);
  });
});
