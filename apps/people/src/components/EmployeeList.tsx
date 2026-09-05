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
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Employee register"
    >
      <h2 className="mb-3 text-lg font-semibold">Employees</h2>
      <input
        className="mb-3 box-border w-full border border-neutral-300 px-2 py-1.5"
        type="search"
        placeholder="Search name or role"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        aria-label="Search employees"
      />
      <ul className="m-0 max-h-[70vh] list-none overflow-auto p-0">
        {employees.map((employee) => {
          const oversubscribed = oversubscribedIds.has(employee.id);
          const selected = selectedId === employee.id;
          return (
            <li key={employee.id}>
              <button
                type="button"
                className={`w-full cursor-pointer border border-transparent bg-transparent p-2 text-left hover:bg-neutral-200 ${
                  selected ? 'border-neutral-800 bg-neutral-200' : ''
                }`}
                onClick={() => onSelect(employee.id)}
              >
                <span className="block font-semibold">{employee.name}</span>
                <span className="text-sm text-neutral-600">
                  {employee.role} · {employee.weeklyHours} h/week
                </span>
                {oversubscribed ? (
                  <span className="mt-0.5 inline-block border border-red-800 px-1.5 py-0.5 text-xs text-red-800">
                    Oversubscribed
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {employees.length === 0 ? (
        <p className="text-neutral-600">No employees match this search.</p>
      ) : null}
    </section>
  );
}
