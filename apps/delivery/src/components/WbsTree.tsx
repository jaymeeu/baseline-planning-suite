import { useEffect, useMemo, useState } from 'react';
import { MAX_WBS_DEPTH, type BreakdownItem, type WbsTreeNode } from '@bps/domain';
import { WbsTable } from './WbsTable';
import {
  AddChildModal,
  AddRootModal,
  DeleteModal,
  MoveModal,
  RenameModal,
} from './WbsModals';
import {
  collectExpandableIds,
  collectRootExpandableIds,
  computeMoveTargets,
  itemName,
} from './wbsHelpers';

interface WbsTreeProps {
  projectName: string;
  forest: readonly WbsTreeNode[];
  flat: readonly WbsTreeNode[];
  items: readonly BreakdownItem[];
  onAddRoot: (name: string) => Promise<void>;
  onAddChild: (parentId: string, name: string) => Promise<void>;
  onRename: (itemId: string, name: string) => Promise<void>;
  onMove: (itemId: string, newParentId: string | null) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

type ModalKind =
  | { type: 'none' }
  | { type: 'addRoot' }
  | { type: 'addChild' }
  | { type: 'rename'; id: string; name: string }
  | { type: 'move'; id: string; parentId: string }
  | { type: 'delete'; id: string };

export function WbsTree({
  projectName,
  forest,
  flat,
  items,
  onAddRoot,
  onAddChild,
  onRename,
  onMove,
  onDelete,
}: WbsTreeProps) {
  const [modal, setModal] = useState<ModalKind>({ type: 'none' });
  const [modalError, setModalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(collectRootExpandableIds(forest)),
  );

  const projectId = forest[0]?.item.projectId ?? `empty:${projectName}`;

  useEffect(() => {
    setExpandedIds(new Set(collectRootExpandableIds(forest)));
    setModal({ type: 'none' });
    setModalError(null);
    // Reset expansion only when switching projects, not on every WBS edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: forest read on project change
  }, [projectId]);

  const expandableIds = useMemo(
    () => collectExpandableIds(forest),
    [forest],
  );

  const eligibleParents = useMemo(
    () => flat.filter((node) => node.depth < MAX_WBS_DEPTH),
    [flat],
  );

  const moveTargets = useMemo(() => {
    if (modal.type !== 'move') return [];
    return computeMoveTargets(flat, items, modal.id);
  }, [flat, items, modal]);

  function closeModal(): void {
    setModal({ type: 'none' });
    setModalError(null);
  }

  function openModal(next: ModalKind): void {
    setModalError(null);
    setModal(next);
  }

  function toggleExpanded(id: string): void {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function ensureExpanded(id: string): void {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  async function runBusy(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setModalError(null);
    try {
      await action();
      closeModal();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bps-panel" aria-label="Work breakdown structure">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="bps-section-title mb-1">{projectName}</h2>
          <p className="bps-meta m-0">
            Max depth {MAX_WBS_DEPTH}. Parents are derived (read-only for
            allocations). Expand a parent to see its children.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="bps-btn bps-btn--primary bps-btn--sm"
            onClick={() => openModal({ type: 'addRoot' })}
          >
            Add root item
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--primary bps-btn--sm"
            disabled={eligibleParents.length === 0}
            onClick={() => openModal({ type: 'addChild' })}
          >
            Add child
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--ghost bps-btn--sm"
            disabled={expandableIds.length === 0}
            onClick={() => setExpandedIds(new Set(expandableIds))}
          >
            Expand all
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--ghost bps-btn--sm"
            disabled={expandedIds.size === 0}
            onClick={() => setExpandedIds(new Set())}
          >
            Collapse all
          </button>
        </div>
      </div>

      {flat.length === 0 ? (
        <p className="bps-meta mb-3">
          No breakdown items yet. Use <strong>Add root item</strong> to start
          the tree.
        </p>
      ) : (
        <WbsTable
          forest={forest}
          expandedIds={expandedIds}
          busy={busy}
          onToggleExpanded={toggleExpanded}
          onRename={(id, name) => openModal({ type: 'rename', id, name })}
          onMove={(id, parentId) => openModal({ type: 'move', id, parentId })}
          onDelete={(id) => openModal({ type: 'delete', id })}
        />
      )}

      <AddRootModal
        open={modal.type === 'addRoot'}
        busy={busy}
        error={modalError}
        onClose={closeModal}
        onSubmit={(name) => runBusy(() => onAddRoot(name))}
      />

      <AddChildModal
        open={modal.type === 'addChild'}
        busy={busy}
        error={modalError}
        onClose={closeModal}
        parents={eligibleParents}
        onSubmit={(parentId, name) =>
          runBusy(async () => {
            await onAddChild(parentId, name);
            ensureExpanded(parentId);
          })
        }
      />

      <RenameModal
        open={modal.type === 'rename'}
        busy={busy}
        error={modalError}
        onClose={closeModal}
        itemLabel={
          modal.type === 'rename' ? itemName(items, modal.id) : ''
        }
        initialName={modal.type === 'rename' ? modal.name : ''}
        onSubmit={(name) => {
          if (modal.type !== 'rename') return Promise.resolve();
          return runBusy(() => onRename(modal.id, name));
        }}
      />

      <MoveModal
        open={modal.type === 'move'}
        busy={busy}
        error={modalError}
        onClose={closeModal}
        itemLabel={modal.type === 'move' ? itemName(items, modal.id) : ''}
        initialParentId={modal.type === 'move' ? modal.parentId : ''}
        targets={moveTargets}
        onSubmit={(newParentId) => {
          if (modal.type !== 'move') return Promise.resolve();
          const id = modal.id;
          return runBusy(async () => {
            await onMove(id, newParentId);
            if (newParentId) ensureExpanded(newParentId);
          });
        }}
      />

      <DeleteModal
        open={modal.type === 'delete'}
        busy={busy}
        error={modalError}
        onClose={closeModal}
        itemLabel={
          modal.type === 'delete' ? itemName(items, modal.id) : ''
        }
        onConfirm={() => {
          if (modal.type !== 'delete') return Promise.resolve();
          return runBusy(() => onDelete(modal.id));
        }}
      />
    </section>
  );
}
