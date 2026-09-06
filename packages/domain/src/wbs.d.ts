import type { CapacityAllocation } from './capacity';
import type { BreakdownItem, Id } from './types';
/** Maximum WBS depth: root = 1, deepest leaf = 3. */
export declare const MAX_WBS_DEPTH = 3;
/** Direct children of `parentId` (null = project roots), stable by id. */
export declare function childrenOf(items: readonly BreakdownItem[], parentId: Id | null): BreakdownItem[];
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
export interface WbsTreeNode {
    item: BreakdownItem;
    depth: number;
    isLeaf: boolean;
    children: WbsTreeNode[];
}
/** Build an ordered forest for one project (roots first, children nested). */
export declare function buildWbsForest(items: readonly BreakdownItem[], projectId: Id): WbsTreeNode[];
/** Flatten forest pre-order for indented list UIs. */
export declare function flattenWbsForest(forest: readonly WbsTreeNode[]): WbsTreeNode[];
/**
 * All descendant ids of `itemId` (not including itself), depth-first.
 */
export declare function collectDescendants(items: readonly BreakdownItem[], itemId: Id): Id[];
/** Max relative depth of a subtree rooted at `itemId` (leaf = 1). */
export declare function subtreeHeight(items: readonly BreakdownItem[], itemId: Id): number;
/**
 * Validate moving `itemId` under `newParentId` (null = become root).
 * Rejects missing items, cross-project moves, cycles, and depth > MAX_WBS_DEPTH.
 */
export declare function assertCanMoveItem(items: readonly BreakdownItem[], itemId: Id, newParentId: Id | null): void;
export interface InsertChildPlanInput {
    items: readonly BreakdownItem[];
    parentId: Id;
    childId: Id;
    childName: string;
    /** Allocations currently attached to the parent (if it is still a leaf). */
    parentAllocations: readonly CapacityAllocation[];
    /** ISO timestamp applied to reassigned allocations. */
    updatedAt: string;
}
export interface InsertChildPlan {
    newChild: BreakdownItem;
    /** Allocations rewritten to the new child (empty if parent had none). */
    reassignedAllocations: CapacityAllocation[];
    movedAllocationCount: number;
}
/**
 * Plan inserting a child under `parentId`.
 * If the parent was a leaf with allocations, those allocations move onto the new child.
 */
export declare function planInsertChildWithAllocations(input: InsertChildPlanInput): InsertChildPlan;
/** Ids to remove when deleting a WBS node (self + descendants). */
export declare function collectSubtreeIds(items: readonly BreakdownItem[], itemId: Id): Id[];
