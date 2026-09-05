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
    <section className="bps-panel" aria-label="Employee details">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="bps-section-title">Employee details</h2>
        {oversubscribed ? (
          <span className="bps-badge bps-badge--over">Oversubscribed</span>
        ) : null}
      </div>
      {oversubscribed ? (
        <p className="bps-meta mb-3">
          Capacity exceeds 100% in at least one month across all projects.
        </p>
      ) : null}
      <p className="bps-meta mb-3">
        ID <span className="bps-data text-bps-ink">{employee.id}</span>
      </p>
      <div className="bps-field mb-3">
        <label htmlFor="emp-name">Name</label>
        <input
          id="emp-name"
          className="bps-field__control"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="bps-field mb-3">
        <label htmlFor="emp-role">Role</label>
        <input
          id="emp-role"
          className="bps-field__control"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
      </div>
      <div className="bps-field mb-3">
        <label htmlFor="emp-hours">Weekly hours</label>
        <select
          id="emp-hours"
          className="bps-field__control"
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
      {error ? (
        <div className="bps-alert bps-alert--error mb-3" role="alert">
          <strong>Could not save</strong>
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="bps-alert bps-alert--status mb-3" role="status">
          {message}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bps-btn bps-btn--primary"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            setError(null);
            void onSave({ name, role, weeklyHours })
              .then(() => setMessage('Employee saved'))
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : 'Save failed'),
              )
              .finally(() => setSaving(false));
          }}
        >
          {saving ? 'Saving…' : 'Save employee'}
        </button>
      </div>
    </section>
  );
}
