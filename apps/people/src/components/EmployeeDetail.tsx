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
    <section className="panel" aria-label="Employee details">
      <h2>Employee details</h2>
      {oversubscribed ? (
        <p className="badge-over">Oversubscribed (capacity &gt; 100% in at least one month)</p>
      ) : null}
      <p className="muted">ID: {employee.id}</p>
      <div className="form-row">
        <label htmlFor="emp-name">Name</label>
        <input
          id="emp-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="emp-role">Role</label>
        <input
          id="emp-role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="emp-hours">Weekly hours</label>
        <select
          id="emp-hours"
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
      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}
      <div className="form-actions">
        <button
          type="button"
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
