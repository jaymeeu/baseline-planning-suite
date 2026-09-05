import { startTransition, useEffect, useState } from 'react';
import type { Project } from '@bps/domain';
import { BpsModal, ModalError, submitModalOnEnter } from './BpsModal';

interface ProjectListProps {
  projects: readonly Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSave: (draft: {
    id?: string;
    name: string;
    startDate: string;
    endDate: string;
  }) => Promise<void>;
}

const DEFAULT_START = '2026-01-01';
const DEFAULT_END = '2026-12-31';

type ProjectModal =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; project: Project };

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onSave,
}: ProjectListProps) {
  const [modal, setModal] = useState<ProjectModal>({ type: 'closed' });
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(DEFAULT_START);
  const [endDate, setEndDate] = useState(DEFAULT_END);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = modal.type !== 'closed';
  const editing = modal.type === 'edit';

  useEffect(() => {
    if (modal.type === 'closed') return;
    if (modal.type === 'create') {
      setName('');
      setStartDate(DEFAULT_START);
      setEndDate(DEFAULT_END);
    } else {
      setName(modal.project.name);
      setStartDate(modal.project.startDate);
      setEndDate(modal.project.endDate);
    }
    setError(null);
  }, [modal]);

  function closeModal(): void {
    setModal({ type: 'closed' });
    setError(null);
  }

  function submit(): void {
    setBusy(true);
    setError(null);
    void onSave({
      id: editing ? modal.project.id : undefined,
      name,
      startDate,
      endDate,
    })
      .then(() => closeModal())
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Save failed'),
      )
      .finally(() => setBusy(false));
  }

  return (
    <section className="bps-panel" aria-label="Projects">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="bps-section-title" id="delivery-projects-heading">
          Projects
        </h2>
        <button
          type="button"
          className="bps-btn bps-btn--primary bps-btn--sm"
          onClick={() => setModal({ type: 'create' })}
        >
          Create project
        </button>
      </div>

      <ul
        className="bps-list m-0 max-h-[70vh] overflow-auto"
        aria-labelledby="delivery-projects-heading"
      >
        {projects.map((project) => {
          const selected = selectedId === project.id;
          return (
            <li
              key={project.id}
              className="bps-list-item"
              aria-current={selected ? 'true' : undefined}
            >
              <button
                type="button"
                className="bps-list-item__main"
                aria-label={`${project.name}, ${project.startDate} to ${project.endDate}`}
                onClick={() => {
                  startTransition(() => {
                    onSelect(project.id);
                  });
                }}
              >
                <span className="bps-list-row__name" aria-hidden="true">
                  {project.name}
                </span>
                <span className="bps-list-row__meta" aria-hidden="true">
                  {project.startDate} → {project.endDate}
                </span>
              </button>
              <button
                type="button"
                className="bps-btn bps-btn--ghost bps-btn--sm bps-list-item__action"
                aria-label={`Edit ${project.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setModal({ type: 'edit', project });
                }}
              >
                Edit
              </button>
            </li>
          );
        })}
      </ul>

      {projects.length === 0 ? (
        <p className="bps-meta mb-0 mt-3">
          No projects yet. Use <strong>Create project</strong> to add one.
        </p>
      ) : null}

      <BpsModal
        open={open}
        title={editing ? `Edit — ${modal.project.name}` : 'Create project'}
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="bps-btn bps-btn--ghost"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bps-btn bps-btn--primary"
              disabled={busy || name.trim() === ''}
              onClick={submit}
            >
              {editing ? 'Update project' : 'Create project'}
            </button>
          </>
        }
      >
        <div className="bps-field mb-3">
          <label htmlFor="proj-name">Name</label>
          <input
            id="proj-name"
            className="bps-field__control"
            value={name}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            onKeyDown={submitModalOnEnter}
          />
        </div>
        <div className="bps-field mb-3">
          <label htmlFor="proj-start">Start date</label>
          <input
            id="proj-start"
            className="bps-field__control"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="bps-field">
          <label htmlFor="proj-end">End date</label>
          <input
            id="proj-end"
            className="bps-field__control"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
        <ModalError message={error} />
      </BpsModal>
    </section>
  );
}
