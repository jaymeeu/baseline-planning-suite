import type { CapacityAllocation } from './capacity';
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

/** Direct children of `parentId` (null = project roots), stable by id. */
export function childrenOf(
  items: readonly BreakdownItem[],
  parentId: Id | null,
): BreakdownItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
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

export interface WbsTreeNode {
  item: BreakdownItem;
  depth: number;
  isLeaf: boolean;
  children: WbsTreeNode[];
}

/** Build an ordered forest for one project (roots first, children nested). */
export function buildWbsForest(
  items: readonly BreakdownItem[],
  projectId: Id,
): WbsTreeNode[] {
  const projectItems = items.filter((item) => item.projectId === projectId);

  function build(parentId: Id | null, depth: number): WbsTreeNode[] {
    return childrenOf(projectItems, parentId).map((item) => {
      const children = build(item.id, depth + 1);
      return {
        item,
        depth,
        isLeaf: children.length === 0,
        children,
      };
    });
  }

  return build(null, 1);
}

/** Flatten forest pre-order for indented list UIs. */
export function flattenWbsForest(
  forest: readonly WbsTreeNode[],
): WbsTreeNode[] {
  const out: WbsTreeNode[] = [];
  function walk(nodes: readonly WbsTreeNode[]): void {
    for (const node of nodes) {
      out.push(node);
      walk(node.children);
    }
  }
  walk(forest);
  return out;
}

/**
 * All descendant ids of `itemId` (not including itself), depth-first.
 */
export function collectDescendants(
  items: readonly BreakdownItem[],
  itemId: Id,
): Id[] {
  if (!indexById(items).has(itemId)) {
    throw new Error(`Breakdown item not found: ${itemId}`);
  }
  const result: Id[] = [];
  function walk(parentId: Id): void {
    for (const child of childrenOf(items, parentId)) {
      result.push(child.id);
      walk(child.id);
    }
  }
  walk(itemId);
  return result;
}

/** Max relative depth of a subtree rooted at `itemId` (leaf = 1). */
export function subtreeHeight(
  items: readonly BreakdownItem[],
  itemId: Id,
): number {
  const kids = childrenOf(items, itemId);
  if (kids.length === 0) return 1;
  let max = 0;
  for (const child of kids) {
    max = Math.max(max, subtreeHeight(items, child.id));
  }
  return 1 + max;
}

/**
 * Validate moving `itemId` under `newParentId` (null = become root).
 * Rejects missing items, cross-project moves, cycles, and depth > MAX_WBS_DEPTH.
 */
export function assertCanMoveItem(
  items: readonly BreakdownItem[],
  itemId: Id,
  newParentId: Id | null,
): void {
  const byId = indexById(items);
  const item = byId.get(itemId);
  if (!item) {
    throw new Error(`Breakdown item not found: ${itemId}`);
  }

  if (newParentId === item.parentId) {
    return;
  }

  if (newParentId === itemId) {
    throw new Error(`Cannot move ${itemId} under itself`);
  }

  if (newParentId !== null) {
    const parent = byId.get(newParentId);
    if (!parent) {
      throw new Error(`Breakdown item not found: ${newParentId}`);
    }
    if (parent.projectId !== item.projectId) {
      throw new Error(
        `Cannot move ${itemId} across projects (${item.projectId} → ${parent.projectId})`,
      );
    }
    const descendants = new Set(collectDescendants(items, itemId));
    if (descendants.has(newParentId)) {
      throw new Error(
        `Cannot move ${itemId} under descendant ${newParentId} (cycle)`,
      );
    }
  }

  const height = subtreeHeight(items, itemId);
  const parentDepth =
    newParentId === null ? 0 : getBreakdownDepth(items, newParentId);
  const resultingMaxDepth = parentDepth + height;
  if (resultingMaxDepth > MAX_WBS_DEPTH) {
    throw new Error(
      `WBS depth cannot exceed ${MAX_WBS_DEPTH}; moving ${itemId} would reach depth ${resultingMaxDepth}`,
    );
  }
}

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
export function planInsertChildWithAllocations(
  input: InsertChildPlanInput,
): InsertChildPlan {
  const { items, parentId, childId, childName, parentAllocations, updatedAt } =
    input;
  const byId = indexById(items);
  const parent = byId.get(parentId);
  if (!parent) {
    throw new Error(`Breakdown item not found: ${parentId}`);
  }

  assertCanInsertChild(items, parentId);

  if (byId.has(childId)) {
    throw new Error(`Breakdown item already exists: ${childId}`);
  }

  const parentIsLeaf = isLeaf(items, parentId);
  if (!parentIsLeaf && parentAllocations.length > 0) {
    throw new Error(
      `Parent ${parentId} already has children; allocations must not remain on non-leaves`,
    );
  }

  const newChild: BreakdownItem = {
    id: childId,
    projectId: parent.projectId,
    parentId,
    name: childName,
  };

  const reassignedAllocations = parentAllocations.map((allocation) => ({
    ...allocation,
    breakdownItemId: childId,
    updatedAt,
  }));

  return {
    newChild,
    reassignedAllocations,
    movedAllocationCount: reassignedAllocations.length,
  };
}

/** Ids to remove when deleting a WBS node (self + descendants). */
export function collectSubtreeIds(
  items: readonly BreakdownItem[],
  itemId: Id,
): Id[] {
  return [itemId, ...collectDescendants(items, itemId)];
}
