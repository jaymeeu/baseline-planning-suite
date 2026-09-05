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
    <section className="panel" aria-label="Employee register">
      <h2>Employees</h2>
      <input
        className="search-input"
        type="search"
        placeholder="Search name or role"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Search employees"
      />
      <ul className="employee-list">
        {employees.map((employee) => {
          const oversubscribed = oversubscribedIds.has(employee.id);
          return (
            <li key={employee.id}>
              <button
                type="button"
                className={selectedId === employee.id ? 'active' : undefined}
                onClick={() => onSelect(employee.id)}
              >
                <span className="employee-name">{employee.name}</span>
                <span className="employee-sub">
                  {employee.role} · {employee.weeklyHours} h/week
                </span>
                {oversubscribed ? (
                  <span className="badge-over">Oversubscribed</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {employees.length === 0 ? (
        <p className="muted">No employees match this search.</p>
      ) : null}
    </section>
  );
}
