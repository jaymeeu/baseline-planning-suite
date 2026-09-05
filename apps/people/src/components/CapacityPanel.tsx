import type { EmployeeMonthCapacity } from '@bps/domain';

interface CapacityPanelProps {
  rows: readonly EmployeeMonthCapacity[];
}

export function CapacityPanel({ rows }: CapacityPanelProps) {
  const overRows = rows.filter((row) => row.isOverCapacity);

  return (
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Capacity status"
    >
      <h2 className="mb-3 text-lg font-semibold">Capacity (all projects)</h2>
      <p className="text-neutral-600">
        100% = 1.0 person-month. Includes allocations from every project.
        Overcapacity is flagged, never blocked.
      </p>
      {rows.length === 0 ? (
        <p className="text-neutral-600">No allocations for this employee.</p>
      ) : (
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-neutral-300 px-2 py-1 text-left">
                Month
              </th>
              <th className="border border-neutral-300 px-2 py-1 text-left">
                Total PM
              </th>
              <th className="border border-neutral-300 px-2 py-1 text-left">%</th>
              <th className="border border-neutral-300 px-2 py-1 text-left">
                Status
              </th>
              <th className="border border-neutral-300 px-2 py-1 text-left">
                Causing allocation
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.employeeId}-${row.month}`}
                className={row.isOverCapacity ? 'bg-red-100' : undefined}
              >
                <td className="border border-neutral-300 px-2 py-1">
                  {row.month}
                </td>
                <td className="border border-neutral-300 px-2 py-1">
                  {row.totalPm.toFixed(2)}
                </td>
                <td className="border border-neutral-300 px-2 py-1">
                  {row.capacityPercent.toFixed(1)}
                </td>
                <td className="border border-neutral-300 px-2 py-1">
                  {row.isOverCapacity ? 'Oversubscribed' : 'OK'}
                </td>
                <td className="border border-neutral-300 px-2 py-1">
                  {row.causingAllocationId ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {overRows.length > 0 ? (
        <p className="mt-2 inline-block border border-red-800 px-1.5 py-0.5 text-xs text-red-800">
          {overRows.length} month(s) over capacity
        </p>
      ) : null}
    </section>
  );
}
