import type { EmployeeMonthCapacity } from '@bps/domain';

interface CapacityPanelProps {
  rows: readonly EmployeeMonthCapacity[];
}

export function CapacityPanel({ rows }: CapacityPanelProps) {
  const overRows = rows.filter((row) => row.isOverCapacity);

  return (
    <section className="panel" aria-label="Capacity status">
      <h2>Capacity (all projects)</h2>
      <p className="muted">
        100% = 1.0 person-month. Includes allocations from every project.
        Overcapacity is flagged, never blocked.
      </p>
      {rows.length === 0 ? (
        <p className="muted">No allocations for this employee.</p>
      ) : (
        <table className="capacity-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total PM</th>
              <th>%</th>
              <th>Status</th>
              <th>Causing allocation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.employeeId}-${row.month}`}
                className={row.isOverCapacity ? 'over' : undefined}
              >
                <td>{row.month}</td>
                <td>{row.totalPm.toFixed(2)}</td>
                <td>{row.capacityPercent.toFixed(1)}</td>
                <td>{row.isOverCapacity ? 'Oversubscribed' : 'OK'}</td>
                <td>{row.causingAllocationId ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {overRows.length > 0 ? (
        <p className="badge-over">
          {overRows.length} month(s) over capacity
        </p>
      ) : null}
    </section>
  );
}
