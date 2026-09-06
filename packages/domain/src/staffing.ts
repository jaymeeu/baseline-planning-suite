import type { Allocation, BreakdownItem, Id, YearMonth } from './types';
import { collectDescendants, isLeaf } from './wbs';

/**
 * Leaf ids under `breakdownItemId` (itself if already a leaf).
 * Returns [] when the node is missing from `items`.
 */
export function leafIdsUnder(
  items: readonly BreakdownItem[],
  breakdownItemId: Id,
): Id[] {
  if (!items.some((item) => item.id === breakdownItemId)) {
    return [];
  }
  if (isLeaf(items, breakdownItemId)) {
    return [breakdownItemId];
  }
  return collectDescendants(items, breakdownItemId).filter((id) =>
    isLeaf(items, id),
  );
}

/**
 * Canonical PM for one employee/month under a WBS node.
 * Leaf: that node's allocation amount (0 if none).
 * Parent: sum of descendant leaf allocations for the same employee/month.
 */
export function sumLeafAllocationsPm(
  items: readonly BreakdownItem[],
  allocations: readonly Allocation[],
  breakdownItemId: Id,
  employeeId: Id,
  month: YearMonth,
): number {
  const leaves = new Set(leafIdsUnder(items, breakdownItemId));
  let total = 0;
  for (const allocation of allocations) {
    if (
      leaves.has(allocation.breakdownItemId) &&
      allocation.employeeId === employeeId &&
      allocation.month === month
    ) {
      total += allocation.amount;
    }
  }
  return total;
}
