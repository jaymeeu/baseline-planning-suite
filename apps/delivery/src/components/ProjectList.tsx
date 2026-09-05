import { useState } from 'react';
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
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Projects"
    >
      <h2 className="mb-3 text-lg font-semibold">Projects</h2>
      <ul className="m-0 mb-3 max-h-[40vh] list-none overflow-auto p-0">
        {projects.map((project) => {
          const selected = selectedId === project.id;
          return (
            <li key={project.id}>
              <button
                type="button"
                className={`w-full cursor-pointer border border-transparent bg-transparent p-2 text-left hover:bg-neutral-200 ${
                  selected ? 'border-neutral-800 bg-neutral-200' : ''
                }`}
                onClick={() => onSelect(project.id)}
              >
                <span className="block font-semibold">{project.name}</span>
                <span className="text-sm text-neutral-600">
                  {project.startDate} → {project.endDate}
                </span>
              </button>
              <div className="px-2 pb-2">
                <button
                  type="button"
                  className="cursor-pointer border border-neutral-400 bg-white px-2 py-1 text-xs"
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
        <p className="text-neutral-600">No projects yet.</p>
      ) : null}

      <h3 className="mb-2 text-base font-semibold">
        {editingId ? 'Edit project' : 'Create project'}
      </h3>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="proj-name">Name</label>
        <input
          id="proj-name"
          className="border border-neutral-300 px-2 py-1.5"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="proj-start">Start date</label>
        <input
          id="proj-start"
          className="border border-neutral-300 px-2 py-1.5"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="proj-end">End date</label>
        <input
          id="proj-end"
          className="border border-neutral-300 px-2 py-1.5"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
        />
      </div>
      {error ? <p className="my-2 text-red-800">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
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
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
            onClick={resetForm}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
