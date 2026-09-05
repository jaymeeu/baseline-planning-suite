import type { BreakdownItem, Id } from './types';

/** Maximum WBS depth: root = 1, deepest leaf = 3. */
export const MAX_WBS_DEPTH = 3;

function indexById(items: readonly BreakdownItem[]): Map<Id, BreakdownItem> {
  const map = new Map<Id, BreakdownItem>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

function childrenOf(
  items: readonly BreakdownItem[],
  parentId: Id,
): BreakdownItem[] {
  return items.filter((item) => item.parentId === parentId);
}

/**
 * Depth of a breakdown item. Root (`parentId === null`) is depth 1.
 * Throws if the item is missing or the parent chain is broken / cyclic.
 */
export function getBreakdownDepth(
  items: readonly BreakdownItem[],
  itemId: Id,
): number {
  const byId = indexById(items);
  let depth = 0;
  let currentId: Id | null = itemId;
  const seen = new Set<Id>();

  while (currentId !== null) {
    if (seen.has(currentId)) {
      throw new Error(`WBS cycle detected at item ${currentId}`);
    }
    seen.add(currentId);

    const item = byId.get(currentId);
    if (!item) {
      throw new Error(`Breakdown item not found: ${currentId}`);
    }

    depth += 1;
    currentId = item.parentId;
  }

  return depth;
}

export function hasChildren(
  items: readonly BreakdownItem[],
  itemId: Id,
): boolean {
  return childrenOf(items, itemId).length > 0;
}

/** A leaf has no children; only leaves may hold allocations. */
export function isLeaf(items: readonly BreakdownItem[], itemId: Id): boolean {
  if (!indexById(items).has(itemId)) {
    throw new Error(`Breakdown item not found: ${itemId}`);
  }
  return !hasChildren(items, itemId);
}

/**
 * Parents are derived from children — allocations must only attach to leaves.
 */
export function assertAllocationTargetIsLeaf(
  items: readonly BreakdownItem[],
  breakdownItemId: Id,
): void {
  if (!isLeaf(items, breakdownItemId)) {
    throw new Error(
      `Allocations may only attach to leaf breakdown items; ${breakdownItemId} has children`,
    );
  }
}

/**
 * Adding a child under `parentId` would create a node at parentDepth + 1.
 * Rejects when that would exceed MAX_WBS_DEPTH.
 */
export function assertCanInsertChild(
  items: readonly BreakdownItem[],
  parentId: Id,
): void {
  const parentDepth = getBreakdownDepth(items, parentId);
  const childDepth = parentDepth + 1;
  if (childDepth > MAX_WBS_DEPTH) {
    throw new Error(
      `WBS depth cannot exceed ${MAX_WBS_DEPTH}; inserting under ${parentId} would be depth ${childDepth}`,
    );
  }
}
