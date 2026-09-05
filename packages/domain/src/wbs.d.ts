import type { BreakdownItem, Id } from './types';
/** Maximum WBS depth: root = 1, deepest leaf = 3. */
export declare const MAX_WBS_DEPTH = 3;
/**
 * Depth of a breakdown item. Root (`parentId === null`) is depth 1.
 * Throws if the item is missing or the parent chain is broken / cyclic.
 */
export declare function getBreakdownDepth(items: readonly BreakdownItem[], itemId: Id): number;
export declare function hasChildren(items: readonly BreakdownItem[], itemId: Id): boolean;
/** A leaf has no children; only leaves may hold allocations. */
export declare function isLeaf(items: readonly BreakdownItem[], itemId: Id): boolean;
/**
 * Parents are derived from children — allocations must only attach to leaves.
 */
export declare function assertAllocationTargetIsLeaf(items: readonly BreakdownItem[], breakdownItemId: Id): void;
/**
 * Adding a child under `parentId` would create a node at parentDepth + 1.
 * Rejects when that would exceed MAX_WBS_DEPTH.
 */
export declare function assertCanInsertChild(items: readonly BreakdownItem[], parentId: Id): void;
