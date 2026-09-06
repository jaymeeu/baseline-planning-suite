import { useMemo, useState } from 'react';
import {
  displayDecimals,
  type BreakdownItem,
  type CapacityAllocation,
  type DisplayUnit,
  type Employee,
  type EmployeeMonthCapacity,
  type RateRecord,
  type YearMonth,
  type WbsTreeNode,
} from '@bps/domain';
import {
  PLANNING_HORIZON,
  displayAmountForCell,
  formatDisplayValue,
  formatYearMonthLabel,
  reconcileColumnTotals,
} from '../deliveryHelpers';
import { UnitSwitcher } from './UnitSwitcher';

interface StaffingGridProps {
  projectName: string;
  items: readonly BreakdownItem[];
  wbsFlat: readonly WbsTreeNode[];
  allocations: readonly CapacityAllocation[];
  employees: readonly Employee[];
  rates: readonly RateRecord[];
  selectedBreakdownId: string | null;
  selectedIsLeaf: boolean;
  selectedBreakdownName: string | null;
  onSelectBreakdown: (id: string) => void;
  displayUnit: DisplayUnit;
  onDisplayUnitChange: (unit: DisplayUnit) => void;
  capacityByEmployeeMonth: ReadonlyMap<string, EmployeeMonthCapacity>;
  onSaveAllocation: (input: {
    breakdownItemId: string;
    employeeId: string;
    month: YearMonth;
    displayValue: string;
  }) => Promise<void>;
}

export function StaffingGrid({
  projectName,
  items,
  wbsFlat,
  allocations,
  employees,
  rates,
  selectedBreakdownId,
  selectedIsLeaf,
  selectedBreakdownName,
  onSelectBreakdown,
  displayUnit,
  onDisplayUnitChange,
  capacityByEmployeeMonth,
  onSaveAllocation,
}: StaffingGridProps) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [cellError, setCellError] = useState<string | null>(null);

  const months = PLANNING_HORIZON;

  const matrix = useMemo(() => {
    if (
      !selectedBreakdownId ||
      !items.some((item) => item.id === selectedBreakdownId)
    ) {
      return null;
    }
    const rows = employees.map((employee) => {
      const cells = months.map((month) => {
        const cell = displayAmountForCell({
          items,
          allocations,
          breakdownItemId: selectedBreakdownId,
          employee,
          month,
          rates,
          unit: displayUnit,
        });
        const capacity = capacityByEmployeeMonth.get(
          `${employee.id}|${month}`,
        );
        return {
          month,
          ...cell,
          isOverCapacity: capacity?.isOverCapacity ?? false,
        };
      });
      return { employee, cells };
    });

    const columnRaw = months.map((_, colIndex) =>
      rows.reduce((sum, row) => sum + row.cells[colIndex]!.value, 0),
    );
    const columnDisplay = reconcileColumnTotals(columnRaw, displayUnit);

    const rowTotalsRaw = rows.map((row) =>
      row.cells.reduce((sum, cell) => sum + cell.value, 0),
    );
    const rowTotalsDisplay = reconcileColumnTotals(rowTotalsRaw, displayUnit);

    const grandRaw = columnRaw.reduce((sum, value) => sum + value, 0);
    const grandDisplay = formatDisplayValue(displayUnit, grandRaw);

    return {
      rows,
      columnDisplay,
      rowTotalsDisplay,
      grandDisplay,
    };
  }, [
    allocations,
    capacityByEmployeeMonth,
    displayUnit,
    employees,
    items,
    months,
    rates,
    selectedBreakdownId,
  ]);

  return (
    <section
      className="bps-panel mt-4"
      aria-label="Staffing grid"
      data-testid="staffing-grid"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="bps-section-title mb-1">Staffing — {projectName}</h2>
          <p className="bps-meta m-0">
            Employees × months. Leaves editable; parents derived/read-only.
            Over-capacity is flagged, never blocked. * = no applicable rate.
          </p>
        </div>
        <UnitSwitcher value={displayUnit} onChange={onDisplayUnitChange} />
      </div>

      <div className="bps-field mb-3 max-w-md">
        <label htmlFor="staffing-wbs">WBS node</label>
        <select
          id="staffing-wbs"
          className="bps-field__control"
          value={selectedBreakdownId ?? ''}
          onChange={(event) => onSelectBreakdown(event.target.value)}
        >
          <option value="" disabled>
            Select breakdown item…
          </option>
          {wbsFlat.map((node) => (
            <option key={node.item.id} value={node.item.id}>
              {'—'.repeat(node.depth - 1)} {node.item.name}
              {node.isLeaf ? ' (leaf)' : ' (derived)'}
            </option>
          ))}
        </select>
        {selectedBreakdownName ? (
          <p className="bps-meta m-0 mt-1">
            Showing: <strong className="text-bps-ink">{selectedBreakdownName}</strong>
            {selectedIsLeaf ? (
              <>
                {' '}
                — <span className="bps-badge bps-badge--leaf">Editable</span>
              </>
            ) : (
              <>
                {' '}
                —{' '}
                <span className="bps-badge bps-badge--parent">
                  Read-only parent
                </span>
              </>
            )}
          </p>
        ) : null}
      </div>

      {cellError ? (
        <div className="bps-alert bps-alert--error mb-3" role="alert">
          <div className="bps-alert__row">
            <span>{cellError}</span>
            <button
              type="button"
              className="bps-btn bps-btn--ghost bps-btn--sm"
              onClick={() => setCellError(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {!selectedBreakdownId || !matrix ? (
        <p className="bps-meta mb-0">
          Select a WBS node above to open the staffing grid.
        </p>
      ) : (
        <>
          {selectedIsLeaf &&
          !matrix.rows.some((row) =>
            row.cells.some((cell) => cell.amountPm > 0),
          ) ? (
            <p className="bps-meta mb-2" role="status">
              No allocations on this leaf yet. Seeded demo data for Ledger is on{' '}
              <strong className="text-bps-ink">Cut-over weekend plan</strong>
              ; for Customer Portal use{' '}
              <strong className="text-bps-ink">SSO federation</strong>.
            </p>
          ) : null}
        <div className="bps-grid-scroll-wrap">
          <div
            className="bps-grid-scroll"
            role="region"
            aria-label={`Staffing grid for ${selectedBreakdownName ?? 'selected WBS'}, ${displayUnit}`}
            tabIndex={0}
          >
            <table className="bps-grid">
              <caption className="sr-only">
                {selectedIsLeaf
                  ? 'Editable leaf allocations by employee and month'
                  : 'Derived parent totals by employee and month, read-only'}
              </caption>
              <thead>
                <tr>
                  <th className="bps-grid__corner" scope="col">
                    Employee
                  </th>
                  {months.map((month) => (
                    <th key={month} scope="col" title={month}>
                      <span className="bps-grid__month">
                        {formatYearMonthLabel(month)}
                      </span>
                    </th>
                  ))}
                  <th scope="col">Row total</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row, rowIndex) => (
                  <tr key={row.employee.id}>
                    <th scope="row" className="bps-grid__sticky">
                      <span className="block">{row.employee.name}</span>
                      <span className="bps-grid__emp-meta">
                        {row.employee.weeklyHours} h/wk
                      </span>
                    </th>
                    {row.cells.map((cell) => {
                      const key = `${row.employee.id}|${cell.month}`;
                      const showMark =
                        displayUnit === 'Cost' &&
                        cell.hasNoApplicableRate &&
                        cell.amountPm > 0;
                      const display = formatDisplayValue(displayUnit, cell.value);
                      const empty = cell.amountPm === 0;
                      const busy = busyKey === key;

                      const cellClass = [
                        'bps-grid__cell',
                        cell.isOverCapacity && cell.amountPm > 0
                          ? 'bps-grid__cell--over'
                          : '',
                        !selectedIsLeaf ? 'bps-grid__cell--derived' : '',
                        busy ? 'bps-grid__cell--busy' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      const stateBits = [
                        cell.isOverCapacity && cell.amountPm > 0
                          ? 'over capacity'
                          : null,
                        showMark ? 'no applicable rate' : null,
                        busy ? 'saving' : null,
                      ]
                        .filter(Boolean)
                        .join(', ');

                      const ariaLabel = `${row.employee.name} ${cell.month}${
                        stateBits ? `, ${stateBits}` : ''
                      }`;

                      return (
                        <td
                          key={key}
                          className={cellClass}
                          aria-busy={busy || undefined}
                        >
                          {selectedIsLeaf ? (
                            <>
                              <input
                                className="bps-grid__input"
                                aria-label={ariaLabel}
                                defaultValue={empty ? '' : display}
                                key={`${key}|${displayUnit}|${display}`}
                                disabled={busy}
                                onBlur={(event) => {
                                  const next = event.target.value;
                                  const previous = empty ? '' : display;
                                  if (next.trim() === previous.trim()) return;
                                  setBusyKey(key);
                                  setCellError(null);
                                  void onSaveAllocation({
                                    breakdownItemId: selectedBreakdownId,
                                    employeeId: row.employee.id,
                                    month: cell.month,
                                    displayValue: next,
                                  })
                                    .catch((err: unknown) =>
                                      setCellError(
                                        err instanceof Error
                                          ? err.message
                                          : 'Save failed',
                                      ),
                                    )
                                    .finally(() => setBusyKey(null));
                                }}
                              />
                              {showMark ? (
                                <span
                                  className="bps-grid__mark"
                                  title="No applicable rate"
                                  aria-hidden="true"
                                >
                                  *
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <span className="bps-grid__value" aria-label={ariaLabel}>
                              {empty ? '—' : display}
                              {showMark ? ' *' : ''}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="bps-grid__total">
                      {formatDisplayValue(
                        displayUnit,
                        matrix.rowTotalsDisplay[rowIndex] ?? 0,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row" className="bps-grid__sticky">
                    Column total
                  </th>
                  {matrix.columnDisplay.map((total, index) => (
                    <td key={months[index]} className="bps-grid__total">
                      {total.toFixed(displayDecimals(displayUnit))}
                    </td>
                  ))}
                  <td className="bps-grid__total bps-grid__grand">
                    {matrix.grandDisplay}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        </>
      )}
    </section>
  );
}
