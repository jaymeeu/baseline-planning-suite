import { useEffect, useState } from 'react';
import type { Employee, WeeklyHours } from '@bps/domain';

interface EmployeeDetailProps {
  employee: Employee;
  oversubscribed: boolean;
  onSave: (draft: {
    name: string;
    role: string;
    weeklyHours: number;
  }) => Promise<void>;
}

export function EmployeeDetail({
  employee,
  oversubscribed,
  onSave,
}: EmployeeDetailProps) {
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [weeklyHours, setWeeklyHours] = useState<WeeklyHours>(
    employee.weeklyHours,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(employee.name);
    setRole(employee.role);
    setWeeklyHours(employee.weeklyHours);
    setMessage(null);
    setError(null);
  }, [employee]);

  return (
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Employee details"
    >
      <h2 className="mb-3 text-lg font-semibold">Employee details</h2>
      {oversubscribed ? (
        <p className="mb-2 inline-block border border-red-800 px-1.5 py-0.5 text-xs text-red-800">
          Oversubscribed (capacity &gt; 100% in at least one month)
        </p>
      ) : null}
      <p className="text-neutral-600">ID: {employee.id}</p>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="emp-name">Name</label>
        <input
          id="emp-name"
          className="border border-neutral-300 px-2 py-1.5"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="emp-role">Role</label>
        <input
          id="emp-role"
          className="border border-neutral-300 px-2 py-1.5"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="emp-hours">Weekly hours</label>
        <select
          id="emp-hours"
          className="border border-neutral-300 px-2 py-1.5"
          value={weeklyHours}
          onChange={(event) =>
            setWeeklyHours(Number(event.target.value) as WeeklyHours)
          }
        >
          <option value={40}>40</option>
          <option value={32}>32</option>
          <option value={20}>20</option>
        </select>
      </div>
      {error ? <p className="my-2 text-red-800">{error}</p> : null}
      {message ? <p className="text-neutral-600">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            setError(null);
            void onSave({ name, role, weeklyHours })
              .then(() => setMessage('Saved'))
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : 'Save failed'),
              )
              .finally(() => setSaving(false));
          }}
        >
          Save employee
        </button>
      </div>
    </section>
  );
}
