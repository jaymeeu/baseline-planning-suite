import { startTransition } from 'react';
import type { Employee } from '@bps/domain';

interface EmployeeListProps {
  employees: readonly Employee[];
  selectedId: string | null;
  oversubscribedIds: ReadonlySet<string>;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
}

export function EmployeeList({
  employees,
  selectedId,
  oversubscribedIds,
  query,
  onQueryChange,
  onSelect,
}: EmployeeListProps) {
  return (
    <section className="bps-panel" aria-label="Employee register">
      <h2 className="bps-section-title mb-3" id="people-employee-heading">
        Employees
      </h2>
      <div className="bps-field mb-3">
        <label htmlFor="people-employee-search">Search</label>
        <input
          id="people-employee-search"
          className="bps-field__control"
          type="search"
          placeholder="Name or role"
          value={query}
          autoComplete="off"
          aria-controls="people-employee-list"
          onChange={(event) => {
            const next = event.target.value;
            startTransition(() => {
              onQueryChange(next);
            });
          }}
        />
        <span className="bps-field__hint" id="people-search-hint">
          Filters the register as you type
        </span>
      </div>
      <ul
        className="bps-list m-0 max-h-[70vh] overflow-auto"
        id="people-employee-list"
        aria-labelledby="people-employee-heading"
      >
        {employees.map((employee) => {
          const oversubscribed = oversubscribedIds.has(employee.id);
          const selected = selectedId === employee.id;
          return (
            <li key={employee.id}>
              <button
                type="button"
                className="bps-list-row"
                aria-current={selected ? 'true' : undefined}
                aria-label={
                  oversubscribed
                    ? `${employee.name}, ${employee.role}, oversubscribed`
                    : `${employee.name}, ${employee.role}`
                }
                onClick={() => {
                  startTransition(() => {
                    onSelect(employee.id);
                  });
                }}
              >
                <span className="bps-list-row__name" aria-hidden="true">
                  {employee.name}
                </span>
                <span className="bps-list-row__meta" aria-hidden="true">
                  {employee.role} · {employee.weeklyHours} h/week
                </span>
                {oversubscribed ? (
                  <span className="bps-badge bps-badge--over mt-1" aria-hidden="true">
                    Oversubscribed
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {employees.length === 0 ? (
        <p className="bps-meta mb-0 mt-3" role="status">
          No employees match this search. Clear the filter to see everyone.
        </p>
      ) : null}
    </section>
  );
}
