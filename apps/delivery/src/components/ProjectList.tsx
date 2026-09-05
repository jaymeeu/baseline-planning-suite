import { startTransition, useState } from 'react';
import type { Project } from '@bps/domain';

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

export function ProjectList({
  projects,
  selectedId,
  onSelect,
  onSave,
}: ProjectListProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startEdit(project: Project) {
    setEditingId(project.id);
    setName(project.name);
    setStartDate(project.startDate);
    setEndDate(project.endDate);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setName('');
    setStartDate('2026-01-01');
    setEndDate('2026-12-31');
    setError(null);
  }

  return (
    <section className="bps-panel" aria-label="Projects">
      <h2 className="bps-section-title mb-3" id="delivery-projects-heading">
        Projects
      </h2>
      <ul
        className="bps-list m-0 mb-3 max-h-[40vh] overflow-auto"
        aria-labelledby="delivery-projects-heading"
      >
        {projects.map((project) => {
          const selected = selectedId === project.id;
          return (
            <li key={project.id} className="mb-1">
              <button
                type="button"
                className="bps-list-row"
                aria-current={selected ? 'true' : undefined}
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
              <div className="px-2 pb-1">
                <button
                  type="button"
                  className="bps-btn bps-btn--ghost bps-btn--sm px-0"
                  aria-label={`Rename or edit dates for ${project.name}`}
                  onClick={() => startEdit(project)}
                >
                  Rename / edit dates
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {projects.length === 0 ? (
        <p className="bps-meta mb-3">
          No projects yet. Create one below to open WBS and staffing.
        </p>
      ) : null}

      <h3 className="bps-section-title mb-3 text-base">
        {editingId ? 'Edit project' : 'Create project'}
      </h3>
      <div className="bps-field mb-3">
        <label htmlFor="proj-name">Name</label>
        <input
          id="proj-name"
          className="bps-field__control"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
      <div className="bps-field mb-3">
        <label htmlFor="proj-end">End date</label>
        <input
          id="proj-end"
          className="bps-field__control"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      {error ? (
        <p className="bps-field__hint bps-field__hint--error mb-3" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bps-btn bps-btn--primary"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void onSave({
              id: editingId ?? undefined,
              name,
              startDate,
              endDate,
            })
              .then(() => resetForm())
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : 'Save failed'),
              )
              .finally(() => setBusy(false));
          }}
        >
          {editingId ? 'Update project' : 'Create project'}
        </button>
        {editingId ? (
          <button
            type="button"
            className="bps-btn bps-btn--secondary"
            onClick={resetForm}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
