import type { BreakdownItem, WbsTreeNode } from '@bps/domain';

export function collectExpandableIds(nodes: readonly WbsTreeNode[]): string[] {
  const ids: string[] = [];
  function walk(list: readonly WbsTreeNode[]): void {
    for (const node of list) {
      if (!node.isLeaf) {
        ids.push(node.item.id);
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return ids;
}

/** Root-level parents only (depth 1 with children) — default expanded set. */
export function collectRootExpandableIds(
  forest: readonly WbsTreeNode[],
): string[] {
  return forest.filter((node) => !node.isLeaf).map((node) => node.item.id);
}

export function itemName(
  items: readonly BreakdownItem[],
  id: string | null,
): string {
  if (!id) return '';
  return items.find((item) => item.id === id)?.name ?? id;
}

export function computeMoveTargets(
  flat: readonly WbsTreeNode[],
  items: readonly BreakdownItem[],
  moveId: string,
): WbsTreeNode[] {
  const forbidden = new Set<string>([moveId]);
  const byParent = new Map<string | null, string[]>();
  for (const item of items) {
    const list = byParent.get(item.parentId) ?? [];
    list.push(item.id);
    byParent.set(item.parentId, list);
  }
  function addDescendants(id: string): void {
    for (const childId of byParent.get(id) ?? []) {
      forbidden.add(childId);
      addDescendants(childId);
    }
  }
  addDescendants(moveId);
  return flat.filter((node) => !forbidden.has(node.item.id));
}
