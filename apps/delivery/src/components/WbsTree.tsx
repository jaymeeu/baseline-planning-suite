import { useMemo, useState } from 'react';
import { MAX_WBS_DEPTH, type BreakdownItem, type WbsTreeNode } from '@bps/domain';

interface WbsTreeProps {
  projectName: string;
  flat: readonly WbsTreeNode[];
  items: readonly BreakdownItem[];
  onAddRoot: (name: string) => Promise<void>;
  onAddChild: (parentId: string, name: string) => Promise<void>;
  onRename: (itemId: string, name: string) => Promise<void>;
  onMove: (itemId: string, newParentId: string | null) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

export function WbsTree({
  projectName,
  flat,
  items,
  onAddRoot,
  onAddChild,
  onRename,
  onMove,
  onDelete,
}: WbsTreeProps) {
  const [rootName, setRootName] = useState('');
  const [childName, setChildName] = useState('');
  const [childParentId, setChildParentId] = useState<string>('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveParentId, setMoveParentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const eligibleParentsForChild = useMemo(
    () => flat.filter((node) => node.depth < MAX_WBS_DEPTH),
    [flat],
  );

  const moveTargets = useMemo(() => {
    if (!moveId) return [];
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
  }, [flat, items, moveId]);

  return (
    <section className="bps-panel" aria-label="Work breakdown structure">
      <h2 className="bps-section-title mb-1">WBS — {projectName}</h2>
      <p className="bps-meta mb-3">
        Max depth {MAX_WBS_DEPTH}. Parents are derived (read-only for
        allocations). Adding a child to an allocated leaf moves allocations onto
        the new child.
      </p>

      <ul className="bps-wbs-list">
        {flat.map((node) => (
          <li
            key={node.item.id}
            className="bps-wbs-row"
            style={{ paddingLeft: `${(node.depth - 1) * 1.25}rem` }}
          >
            <div className="bps-wbs-row__head">
              <span className="bps-wbs-row__name">{node.item.name}</span>
              <span className="bps-meta">depth {node.depth}</span>
              {node.isLeaf ? (
                <span className="bps-badge bps-badge--leaf">Leaf</span>
              ) : (
                <span className="bps-badge bps-badge--parent">
                  Derived parent
                </span>
              )}
            </div>
            <div className="bps-wbs-row__actions">
              <button
                type="button"
                className="bps-btn bps-btn--ghost bps-btn--sm"
                onClick={() => {
                  setRenameId(node.item.id);
                  setRenameValue(node.item.name);
                  setError(null);
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--ghost bps-btn--sm"
                onClick={() => {
                  setMoveId(node.item.id);
                  setMoveParentId(node.item.parentId ?? '');
                  setError(null);
                }}
              >
                Move
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--danger bps-btn--sm"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  setError(null);
                  void onDelete(node.item.id)
                    .catch((err: unknown) =>
                      setError(
                        err instanceof Error ? err.message : 'Delete failed',
                      ),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {flat.length === 0 ? (
        <p className="bps-meta mb-3">
          No breakdown items yet. Add a root item to start the tree.
        </p>
      ) : null}

      {error ? (
        <div className="bps-alert bps-alert--error mb-3" role="alert">
          {error}
        </div>
      ) : null}

      <div className="mb-4 border-t border-bps-line pt-3">
        <h3 className="bps-section-title mb-2 text-base">Add root item</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="bps-field min-w-[180px] flex-1">
            <label htmlFor="wbs-root-name">Root name</label>
            <input
              id="wbs-root-name"
              className="bps-field__control"
              placeholder="Root name"
              value={rootName}
              onChange={(event) => setRootName(event.target.value)}
              aria-label="New root item name"
            />
          </div>
          <button
            type="button"
            className="bps-btn bps-btn--secondary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              setError(null);
              void onAddRoot(rootName)
                .then(() => setRootName(''))
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Add failed'),
                )
                .finally(() => setBusy(false));
            }}
          >
            Add root
          </button>
        </div>
      </div>

      <div className="mb-4 border-t border-bps-line pt-3">
        <h3 className="bps-section-title mb-2 text-base">Add child</h3>
        <div className="bps-field mb-2">
          <label htmlFor="wbs-parent">Parent</label>
          <select
            id="wbs-parent"
            className="bps-field__control"
            value={childParentId}
            onChange={(event) => setChildParentId(event.target.value)}
          >
            <option value="">Select parent…</option>
            {eligibleParentsForChild.map((node) => (
              <option key={node.item.id} value={node.item.id}>
                {'—'.repeat(node.depth - 1)} {node.item.name} (depth{' '}
                {node.depth})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="bps-field min-w-[180px] flex-1">
            <label htmlFor="wbs-child-name">Child name</label>
            <input
              id="wbs-child-name"
              className="bps-field__control"
              placeholder="Child name"
              value={childName}
              onChange={(event) => setChildName(event.target.value)}
              aria-label="New child item name"
            />
          </div>
          <button
            type="button"
            className="bps-btn bps-btn--secondary"
            disabled={busy || !childParentId}
            onClick={() => {
              setBusy(true);
              setError(null);
              void onAddChild(childParentId, childName)
                .then(() => {
                  setChildName('');
                })
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Add failed'),
                )
                .finally(() => setBusy(false));
            }}
          >
            Add child
          </button>
        </div>
      </div>

      {renameId ? (
        <div className="mb-4 border-t border-bps-line pt-3">
          <h3 className="bps-section-title mb-2 text-base">Rename item</h3>
          <div className="flex flex-wrap items-end gap-2">
            <div className="bps-field min-w-[180px] flex-1">
              <label htmlFor="wbs-rename">Name</label>
              <input
                id="wbs-rename"
                className="bps-field__control"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                aria-label="Rename value"
              />
            </div>
            <button
              type="button"
              className="bps-btn bps-btn--primary"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                void onRename(renameId, renameValue)
                  .then(() => {
                    setRenameId(null);
                    setRenameValue('');
                  })
                  .catch((err: unknown) =>
                    setError(
                      err instanceof Error ? err.message : 'Rename failed',
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Save name
            </button>
            <button
              type="button"
              className="bps-btn bps-btn--ghost"
              onClick={() => {
                setRenameId(null);
                setRenameValue('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {moveId ? (
        <div className="mb-2 border-t border-bps-line pt-3">
          <h3 className="bps-section-title mb-2 text-base">Move item</h3>
          <div className="bps-field mb-2">
            <label htmlFor="wbs-move-parent">New parent (empty = root)</label>
            <select
              id="wbs-move-parent"
              className="bps-field__control"
              value={moveParentId}
              onChange={(event) => setMoveParentId(event.target.value)}
            >
              <option value="">(project root)</option>
              {moveTargets.map((node) => (
                <option key={node.item.id} value={node.item.id}>
                  {'—'.repeat(node.depth - 1)} {node.item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="bps-btn bps-btn--primary"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                setError(null);
                void onMove(moveId, moveParentId === '' ? null : moveParentId)
                  .then(() => {
                    setMoveId(null);
                    setMoveParentId('');
                  })
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Move failed'),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Apply move
            </button>
            <button
              type="button"
              className="bps-btn bps-btn--ghost"
              onClick={() => {
                setMoveId(null);
                setMoveParentId('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
