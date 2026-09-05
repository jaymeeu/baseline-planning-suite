import { describe, expect, it } from 'vitest';
import type {
  BreakdownItem,
  CapacityAllocation,
} from '../../packages/domain/src/index';
import {
  assertCanMoveItem,
  buildWbsForest,
  collectSubtreeIds,
  flattenWbsForest,
  planInsertChildWithAllocations,
  subtreeHeight,
} from '../../packages/domain/src/index';

const items: BreakdownItem[] = [
  { id: 'root', projectId: 'p1', parentId: null, name: 'Root' },
  { id: 'l2', projectId: 'p1', parentId: 'root', name: 'Level 2' },
  { id: 'l3', projectId: 'p1', parentId: 'l2', name: 'Level 3' },
  { id: 'other-root', projectId: 'p2', parentId: null, name: 'Other' },
];

describe('WBS forest and descendants', () => {
  it('builds and flattens a project forest', () => {
    const forest = buildWbsForest(items, 'p1');
    expect(forest).toHaveLength(1);
    expect(forest[0]?.item.id).toBe('root');
    expect(forest[0]?.isLeaf).toBe(false);
    expect(forest[0]?.children[0]?.children[0]?.item.id).toBe('l3');
    expect(flattenWbsForest(forest).map((n) => n.item.id)).toEqual([
      'root',
      'l2',
      'l3',
    ]);
  });

  it('collects subtree ids including self', () => {
    expect(collectSubtreeIds(items, 'l2')).toEqual(['l2', 'l3']);
    expect(subtreeHeight(items, 'root')).toBe(3);
    expect(subtreeHeight(items, 'l3')).toBe(1);
  });
});

describe('assertCanMoveItem', () => {
  it('allows moving a leaf under another root-level sibling path within depth', () => {
    const shallow: BreakdownItem[] = [
      { id: 'a', projectId: 'p1', parentId: null, name: 'A' },
      { id: 'b', projectId: 'p1', parentId: null, name: 'B' },
      { id: 'a1', projectId: 'p1', parentId: 'a', name: 'A1' },
    ];
    expect(() => assertCanMoveItem(shallow, 'a1', 'b')).not.toThrow();
  });

  it('rejects cycles, cross-project, and depth overflow', () => {
    expect(() => assertCanMoveItem(items, 'root', 'l3')).toThrow(/cycle/);
    expect(() => assertCanMoveItem(items, 'l3', 'other-root')).toThrow(
      /across projects/,
    );
    expect(() => assertCanMoveItem(items, 'root', null)).not.toThrow();
    // Moving root under nothing is no-op parent change; moving l2 under l3 would cycle
    expect(() => assertCanMoveItem(items, 'l2', 'l3')).toThrow(/cycle/);
  });

  it('rejects moves that would exceed max depth', () => {
    const deepMove: BreakdownItem[] = [
      { id: 'r', projectId: 'p1', parentId: null, name: 'R' },
      { id: 'm', projectId: 'p1', parentId: 'r', name: 'Mid' },
      { id: 'leaf', projectId: 'p1', parentId: 'm', name: 'Leaf' },
      { id: 'side', projectId: 'p1', parentId: null, name: 'Side' },
      { id: 'side-child', projectId: 'p1', parentId: 'side', name: 'Side child' },
    ];
    // Move subtree rooted at `side` (height 2) under `leaf` (depth 3) → max depth 5
    expect(() => assertCanMoveItem(deepMove, 'side', 'leaf')).toThrow(/depth/);
  });
});

describe('planInsertChildWithAllocations', () => {
  it('moves parent leaf allocations onto the new child', () => {
    const leafItems: BreakdownItem[] = [
      { id: 'root', projectId: 'p1', parentId: null, name: 'Root' },
    ];
    const parentAllocations: CapacityAllocation[] = [
      {
        id: 'alloc-1',
        breakdownItemId: 'root',
        employeeId: 'emp-1',
        month: '2026-03',
        amount: 0.5,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'alloc-2',
        breakdownItemId: 'root',
        employeeId: 'emp-2',
        month: '2026-03',
        amount: 0.25,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    const plan = planInsertChildWithAllocations({
      items: leafItems,
      parentId: 'root',
      childId: 'child-1',
      childName: 'Moved work',
      parentAllocations,
      updatedAt: '2026-06-01T12:00:00.000Z',
    });

    expect(plan.newChild).toEqual({
      id: 'child-1',
      projectId: 'p1',
      parentId: 'root',
      name: 'Moved work',
    });
    expect(plan.movedAllocationCount).toBe(2);
    expect(plan.reassignedAllocations.every((a) => a.breakdownItemId === 'child-1')).toBe(
      true,
    );
    expect(plan.reassignedAllocations.every((a) => a.updatedAt === '2026-06-01T12:00:00.000Z')).toBe(
      true,
    );
    expect(parentAllocations.every((a) => a.breakdownItemId === 'root')).toBe(
      true,
    );
  });

  it('returns empty reassignment when parent has no allocations', () => {
    const plan = planInsertChildWithAllocations({
      items: [{ id: 'root', projectId: 'p1', parentId: null, name: 'Root' }],
      parentId: 'root',
      childId: 'c1',
      childName: 'Child',
      parentAllocations: [],
      updatedAt: '2026-06-01T12:00:00.000Z',
    });
    expect(plan.movedAllocationCount).toBe(0);
    expect(plan.reassignedAllocations).toEqual([]);
  });
});
