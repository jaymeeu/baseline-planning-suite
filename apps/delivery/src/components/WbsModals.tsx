import { useEffect, useState } from 'react';
import type { WbsTreeNode } from '@bps/domain';
import { BpsModal, ModalError, submitModalOnEnter } from './BpsModal';

interface SharedModalProps {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
}

export function AddRootModal({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: SharedModalProps & {
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) setName('');
  }, [open]);

  return (
    <BpsModal
      open={open}
      title="Add root item"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bps-btn bps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--primary"
            disabled={busy || name.trim() === ''}
            onClick={() => {
              void onSubmit(name);
            }}
          >
            Add root
          </button>
        </>
      }
    >
      <div className="bps-field">
        <label htmlFor="wbs-root-name">Root name</label>
        <input
          id="wbs-root-name"
          className="bps-field__control"
          placeholder="Root name"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={submitModalOnEnter}
          aria-label="New root item name"
        />
      </div>
      <ModalError message={error} />
    </BpsModal>
  );
}

export function AddChildModal({
  open,
  busy,
  error,
  onClose,
  parents,
  onSubmit,
}: SharedModalProps & {
  parents: readonly WbsTreeNode[];
  onSubmit: (parentId: string, name: string) => Promise<void>;
}) {
  const [parentId, setParentId] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setParentId('');
      setName('');
    }
  }, [open]);

  return (
    <BpsModal
      open={open}
      title="Add child"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bps-btn bps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--primary"
            disabled={busy || !parentId || name.trim() === ''}
            onClick={() => {
              void onSubmit(parentId, name);
            }}
          >
            Add child
          </button>
        </>
      }
    >
      <div className="bps-field mb-3">
        <label htmlFor="wbs-parent">Parent</label>
        <select
          id="wbs-parent"
          className="bps-field__control"
          value={parentId}
          autoFocus
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">Select parent…</option>
          {parents.map((node) => (
            <option key={node.item.id} value={node.item.id}>
              {'—'.repeat(node.depth - 1)} {node.item.name} (depth {node.depth})
            </option>
          ))}
        </select>
      </div>
      <div className="bps-field">
        <label htmlFor="wbs-child-name">Child name</label>
        <input
          id="wbs-child-name"
          className="bps-field__control"
          placeholder="Child name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={submitModalOnEnter}
          aria-label="New child item name"
        />
      </div>
      <ModalError message={error} />
    </BpsModal>
  );
}

export function RenameModal({
  open,
  busy,
  error,
  onClose,
  itemLabel,
  initialName,
  onSubmit,
}: SharedModalProps & {
  itemLabel: string;
  initialName: string;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  return (
    <BpsModal
      open={open}
      title={`Rename — ${itemLabel}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bps-btn bps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--primary"
            disabled={busy || name.trim() === ''}
            onClick={() => {
              void onSubmit(name);
            }}
          >
            Save name
          </button>
        </>
      }
    >
      <div className="bps-field">
        <label htmlFor="wbs-rename">Name</label>
        <input
          id="wbs-rename"
          className="bps-field__control"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
          onKeyDown={submitModalOnEnter}
          aria-label="Rename value"
        />
      </div>
      <ModalError message={error} />
    </BpsModal>
  );
}

export function MoveModal({
  open,
  busy,
  error,
  onClose,
  itemLabel,
  initialParentId,
  targets,
  onSubmit,
}: SharedModalProps & {
  itemLabel: string;
  initialParentId: string;
  targets: readonly WbsTreeNode[];
  onSubmit: (newParentId: string | null) => Promise<void>;
}) {
  const [parentId, setParentId] = useState(initialParentId);

  useEffect(() => {
    if (open) setParentId(initialParentId);
  }, [open, initialParentId]);

  return (
    <BpsModal
      open={open}
      title={`Move — ${itemLabel}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bps-btn bps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--primary"
            disabled={busy}
            onClick={() => {
              void onSubmit(parentId === '' ? null : parentId);
            }}
          >
            Apply move
          </button>
        </>
      }
    >
      <div className="bps-field">
        <label htmlFor="wbs-move-parent">New parent (empty = root)</label>
        <select
          id="wbs-move-parent"
          className="bps-field__control"
          value={parentId}
          autoFocus
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">(project root)</option>
          {targets.map((node) => (
            <option key={node.item.id} value={node.item.id}>
              {'—'.repeat(node.depth - 1)} {node.item.name}
            </option>
          ))}
        </select>
      </div>
      <ModalError message={error} />
    </BpsModal>
  );
}

export function DeleteModal({
  open,
  busy,
  error,
  onClose,
  itemLabel,
  onConfirm,
}: SharedModalProps & {
  itemLabel: string;
  onConfirm: () => Promise<void>;
}) {
  return (
    <BpsModal
      open={open}
      title="Delete breakdown item"
      danger
      onClose={onClose}
      footer={
        <>
          <button type="button" className="bps-btn bps-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="bps-btn bps-btn--danger"
            disabled={busy}
            autoFocus
            onClick={() => {
              void onConfirm();
            }}
          >
            Delete
          </button>
        </>
      }
    >
      <p className="m-0 text-bps-ink">
        Delete <strong>{itemLabel}</strong>? This removes the item and its
        subtree allocations. This cannot be undone from the UI.
      </p>
      <ModalError message={error} />
    </BpsModal>
  );
}
