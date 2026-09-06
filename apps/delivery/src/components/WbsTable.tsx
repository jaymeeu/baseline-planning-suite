import type { ReactNode } from 'react';
import type { WbsTreeNode } from '@bps/domain';

export interface WbsTableProps {
  forest: readonly WbsTreeNode[];
  expandedIds: ReadonlySet<string>;
  busy: boolean;
  onToggleExpanded: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onMove: (id: string, parentId: string) => void;
  onDelete: (id: string) => void;
}

export function WbsTable({
  forest,
  expandedIds,
  busy,
  onToggleExpanded,
  onRename,
  onMove,
  onDelete,
}: WbsTableProps) {
  function renderRows(nodes: readonly WbsTreeNode[]): ReactNode[] {
    const rows: ReactNode[] = [];
    for (const node of nodes) {
      const id = node.item.id;
      const hasKids = !node.isLeaf;
      const expanded = hasKids && expandedIds.has(id);
      const childCount = node.children.length;

      rows.push(
        <tr key={id} className="bps-wbs-table__row">
          <td className="bps-wbs-table__name-cell">
            <div
              className="bps-wbs-table__name-inner"
              style={{ paddingLeft: `${(node.depth - 1) * 1.25}rem` }}
            >
              {hasKids ? (
                <button
                  type="button"
                  className="bps-wbs-table__chevron"
                  aria-expanded={expanded}
                  aria-label={
                    expanded
                      ? `Collapse ${node.item.name}`
                      : `Expand ${node.item.name}`
                  }
                  onClick={() => onToggleExpanded(id)}
                >
                  <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                </button>
              ) : (
                <span
                  className="bps-wbs-table__chevron-spacer"
                  aria-hidden="true"
                />
              )}
              <span className="bps-wbs-table__name">{node.item.name}</span>
              {hasKids ? (
                <span className="bps-meta bps-wbs-table__count">
                  {childCount}
                </span>
              ) : null}
            </div>
          </td>
          <td className="bps-wbs-table__kind">
            {node.isLeaf ? (
              <span className="bps-badge bps-badge--leaf">Leaf</span>
            ) : (
              <span className="bps-badge bps-badge--parent">Derived</span>
            )}
          </td>
          <td className="bps-wbs-table__actions-cell">
            <div className="bps-wbs-table__actions">
              <button
                type="button"
                className="bps-btn bps-btn--ghost bps-btn--sm"
                aria-label={`Rename ${node.item.name}`}
                onClick={() => onRename(id, node.item.name)}
              >
                Rename
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--ghost bps-btn--sm"
                aria-label={`Move ${node.item.name}`}
                onClick={() => onMove(id, node.item.parentId ?? '')}
              >
                Move
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--danger bps-btn--sm"
                disabled={busy}
                aria-label={`Delete ${node.item.name}`}
                onClick={() => onDelete(id)}
              >
                Delete
              </button>
            </div>
          </td>
        </tr>,
      );

      if (expanded) {
        rows.push(...renderRows(node.children));
      }
    }
    return rows;
  }

  return (
    <div className="bps-wbs-table-wrap mb-0">
      <table className="bps-wbs-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Kind</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>{renderRows(forest)}</tbody>
      </table>
    </div>
  );
}
