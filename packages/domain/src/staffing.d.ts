import type { Allocation, BreakdownItem, Id, YearMonth } from './types';
/**
 * Leaf ids under `breakdownItemId` (itself if already a leaf).
 * Returns [] when the node is missing from `items`.
 */
export declare function leafIdsUnder(items: readonly BreakdownItem[], breakdownItemId: Id): Id[];
/**
 * Canonical PM for one employee/month under a WBS node.
 * Leaf: that node's allocation amount (0 if none).
 * Parent: sum of descendant leaf allocations for the same employee/month.
 */
export declare function sumLeafAllocationsPm(items: readonly BreakdownItem[], allocations: readonly Allocation[], breakdownItemId: Id, employeeId: Id, month: YearMonth): number;
