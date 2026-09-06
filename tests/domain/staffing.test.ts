import { describe, expect, it } from 'vitest';
import type { Allocation, BreakdownItem } from '../../packages/domain/src/index';
import {
  leafIdsUnder,
  sumLeafAllocationsPm,
} from '../../packages/domain/src/index';

const items: BreakdownItem[] = [
  { id: 'root', projectId: 'p1', parentId: null, name: 'Root' },
  { id: 'a', projectId: 'p1', parentId: 'root', name: 'A' },
  { id: 'b', projectId: 'p1', parentId: 'root', name: 'B' },
  { id: 'a1', projectId: 'p1', parentId: 'a', name: 'A1' },
  { id: 'a2', projectId: 'p1', parentId: 'a', name: 'A2' },
];

const allocations: Allocation[] = [
  {
    id: '1',
    breakdownItemId: 'a1',
    employeeId: 'emp-1',
    month: '2026-03',
    amount: 0.3,
  },
  {
    id: '2',
    breakdownItemId: 'a2',
    employeeId: 'emp-1',
    month: '2026-03',
    amount: 0.2,
  },
  {
    id: '3',
    breakdownItemId: 'b',
    employeeId: 'emp-1',
    month: '2026-03',
    amount: 0.4,
  },
  {
    id: '4',
    breakdownItemId: 'a1',
    employeeId: 'emp-2',
    month: '2026-03',
    amount: 0.1,
  },
];

describe('sumLeafAllocationsPm', () => {
  it('returns leaf amount directly', () => {
    expect(
      sumLeafAllocationsPm(items, allocations, 'a1', 'emp-1', '2026-03'),
    ).toBe(0.3);
  });

  it('sums descendant leaves for a parent', () => {
    expect(
      sumLeafAllocationsPm(items, allocations, 'a', 'emp-1', '2026-03'),
    ).toBeCloseTo(0.5);
    expect(
      sumLeafAllocationsPm(items, allocations, 'root', 'emp-1', '2026-03'),
    ).toBeCloseTo(0.9);
  });

  it('lists leaf ids under a node', () => {
    expect(leafIdsUnder(items, 'a').sort()).toEqual(['a1', 'a2']);
    expect(leafIdsUnder(items, 'a1')).toEqual(['a1']);
  });
});
