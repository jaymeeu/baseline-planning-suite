import type { EmployeeMonthCapacity } from '@bps/domain';

interface CapacityPanelProps {
  rows: readonly EmployeeMonthCapacity[];
}

function barWidthPercent(capacityPercent: number): number {
  if (!Number.isFinite(capacityPercent) || capacityPercent <= 0) return 0;
  return Math.min(100, capacityPercent);
}

export function CapacityPanel({ rows }: CapacityPanelProps) {
  const overRows = rows.filter((row) => row.isOverCapacity);

  return (
    <section className="bps-panel" aria-label="Capacity status">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h2 className="bps-section-title">Capacity (all projects)</h2>
        {overRows.length > 0 ? (
          <span className="bps-badge bps-badge--over">
            {overRows.length} month(s) over
          </span>
        ) : null}
      </div>
      <p className="bps-meta mb-3">
        100% = 1.0 person-month. Includes allocations from every project.
        Overcapacity is flagged, never blocked.
      </p>
      {rows.length === 0 ? (
        <p className="bps-meta m-0">
          No allocations for this employee yet. Assign them on a Delivery leaf to
          see the horizon here.
        </p>
      ) : (
        <div className="bps-cap-rows">
          {rows.map((row) => {
            const width = barWidthPercent(row.capacityPercent);
            return (
              <div
                key={`${row.employeeId}-${row.month}`}
                className="bps-cap-row"
                title={
                  row.isOverCapacity
                    ? `Over capacity · cause ${row.causingAllocationId ?? '—'}`
                    : `${row.totalPm.toFixed(2)} PM`
                }
              >
                <span className="bps-data">{row.month}</span>
                <div className="bps-cap-track" aria-hidden="true">
                  <div
                    className={`bps-cap-fill${row.isOverCapacity ? ' bps-cap-fill--over' : ''}`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span
                  className={`bps-cap-pct${row.isOverCapacity ? ' bps-cap-pct--over' : ''}`}
                >
                  {row.capacityPercent.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
      {overRows.length > 0 ? (
        <p className="bps-meta mb-0 mt-3">
          Causing allocation (most recent edit):{' '}
          <span className="bps-data text-bps-ink">
            {overRows.map((r) => r.causingAllocationId ?? '—').join(', ')}
          </span>
        </p>
      ) : null}
    </section>
  );
}
