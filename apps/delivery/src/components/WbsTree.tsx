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
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Work breakdown structure"
    >
      <h2 className="mb-1 text-lg font-semibold">WBS — {projectName}</h2>
      <p className="mb-3 text-sm text-neutral-600">
        Max depth {MAX_WBS_DEPTH}. Parents are derived (read-only for
        allocations). Adding a child to an allocated leaf moves allocations onto
        the new child.
      </p>

      <ul className="m-0 mb-4 list-none p-0">
        {flat.map((node) => (
          <li
            key={node.item.id}
            className="border-b border-neutral-200 py-2"
            style={{ paddingLeft: `${(node.depth - 1) * 1.25}rem` }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{node.item.name}</span>
              <span className="text-xs text-neutral-500">
                depth {node.depth}
              </span>
              {node.isLeaf ? (
                <span className="border border-neutral-400 px-1.5 py-0.5 text-xs">
                  leaf
                </span>
              ) : (
                <span className="border border-neutral-500 bg-neutral-200 px-1.5 py-0.5 text-xs">
                  derived parent
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                className="cursor-pointer border border-neutral-400 bg-white px-2 py-1 text-xs"
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
                className="cursor-pointer border border-neutral-400 bg-white px-2 py-1 text-xs"
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
                className="cursor-pointer border border-red-800 bg-white px-2 py-1 text-xs text-red-800"
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
        <p className="mb-3 text-neutral-600">No breakdown items yet.</p>
      ) : null}

      {error ? <p className="my-2 text-red-800">{error}</p> : null}

      <div className="mb-4 border-t border-neutral-300 pt-3">
        <h3 className="mb-2 text-base font-semibold">Add root item</h3>
        <div className="flex flex-wrap gap-2">
          <input
            className="border border-neutral-300 px-2 py-1.5"
            placeholder="Root name"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            aria-label="New root item name"
          />
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
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

      <div className="mb-4 border-t border-neutral-300 pt-3">
        <h3 className="mb-2 text-base font-semibold">Add child</h3>
        <div className="mb-2 flex flex-col gap-1">
          <label htmlFor="wbs-parent">Parent</label>
          <select
            id="wbs-parent"
            className="border border-neutral-300 px-2 py-1.5"
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
        <div className="flex flex-wrap gap-2">
          <input
            className="border border-neutral-300 px-2 py-1.5"
            placeholder="Child name"
            value={childName}
            onChange={(event) => setChildName(event.target.value)}
            aria-label="New child item name"
          />
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
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
        <div className="mb-4 border-t border-neutral-300 pt-3">
          <h3 className="mb-2 text-base font-semibold">Rename item</h3>
          <div className="flex flex-wrap gap-2">
            <input
              className="border border-neutral-300 px-2 py-1.5"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              aria-label="Rename value"
            />
            <button
              type="button"
              className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
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
              className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
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
        <div className="mb-2 border-t border-neutral-300 pt-3">
          <h3 className="mb-2 text-base font-semibold">Move item</h3>
          <div className="mb-2 flex flex-col gap-1">
            <label htmlFor="wbs-move-parent">New parent (empty = root)</label>
            <select
              id="wbs-move-parent"
              className="border border-neutral-300 px-2 py-1.5"
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
              className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
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
              className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
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
