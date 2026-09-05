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
      className="mt-4 border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Staffing grid"
      data-testid="staffing-grid"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-lg font-semibold">
            Staffing — {projectName}
          </h2>
          <p className="m-0 text-sm text-neutral-600">
            Employees × months. Leaves editable; parents derived/read-only.
            Over-capacity is flagged, never blocked. * = no applicable rate.
          </p>
        </div>
        <UnitSwitcher value={displayUnit} onChange={onDisplayUnitChange} />
      </div>

      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="staffing-wbs" className="text-sm font-medium">
          WBS node
        </label>
        <select
          id="staffing-wbs"
          className="max-w-md border border-neutral-300 px-2 py-1.5"
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
          <p className="text-sm text-neutral-600">
            Showing: <strong>{selectedBreakdownName}</strong>
            {selectedIsLeaf ? ' — editable' : ' — read-only parent totals'}
          </p>
        ) : null}
      </div>

      {cellError ? (
        <p className="mb-2 text-red-800" role="alert">
          {cellError}
        </p>
      ) : null}

      {!selectedBreakdownId || !matrix ? (
        <p className="text-neutral-600">Select a WBS node to open the grid.</p>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-left">
                  Employee
                </th>
                {months.map((month) => (
                  <th
                    key={month}
                    className="border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-right"
                  >
                    {month}
                  </th>
                ))}
                <th className="border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-right">
                  Row total
                </th>
              </tr>
            </thead>
            <tbody>
              {matrix.rows.map((row, rowIndex) => (
                <tr key={row.employee.id}>
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border border-neutral-300 bg-white px-2 py-1 text-left font-medium"
                  >
                    <span className="block">{row.employee.name}</span>
                    <span className="text-xs font-normal text-neutral-500">
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

                    return (
                      <td
                        key={key}
                        className={`border border-neutral-300 px-1 py-0.5 ${
                          cell.isOverCapacity ? 'bg-red-100' : 'bg-white'
                        }`}
                      >
                        {selectedIsLeaf ? (
                          <input
                            className="w-full border-0 bg-transparent px-1 py-1 text-right outline-none focus:bg-neutral-100"
                            aria-label={`${row.employee.name} ${cell.month}`}
                            defaultValue={empty ? '' : display}
                            key={`${key}|${displayUnit}|${display}`}
                            disabled={busyKey === key}
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
                        ) : (
                          <span className="block px-1 py-1 text-right text-neutral-700">
                            {empty ? '—' : display}
                            {showMark ? ' *' : ''}
                          </span>
                        )}
                        {selectedIsLeaf && showMark ? (
                          <span className="block text-right text-xs text-red-800">
                            *
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="border border-neutral-300 px-2 py-1 text-right font-medium">
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
                <th
                  scope="row"
                  className="sticky left-0 z-10 border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-left"
                >
                  Column total
                </th>
                {matrix.columnDisplay.map((total, index) => (
                  <td
                    key={months[index]}
                    className="border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-right font-medium"
                  >
                    {total.toFixed(displayDecimals(displayUnit))}
                  </td>
                ))}
                <td className="border border-neutral-300 bg-neutral-100 px-2 py-1.5 text-right font-semibold">
                  {matrix.grandDisplay}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}
