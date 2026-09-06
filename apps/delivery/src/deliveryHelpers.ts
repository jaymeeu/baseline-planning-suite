import {
  calculateAllocationCost,
  countWorkingDaysInMonth,
  displayDecimals,
  distributeLargestRemainder,
  fromCanonical,
  roundForDisplay,
  sumLeafAllocationsPm,
  type BreakdownItem,
  type CapacityAllocation,
  type DisplayUnit,
  type Employee,
  type Project,
  type RateRecord,
  type UnitConversionContext,
  type YearMonth,
} from '@bps/domain';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Fixture planning horizon (not clipped to project dates). */
export const PLANNING_HORIZON: readonly YearMonth[] = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
  '2026-09',
  '2026-10',
  '2026-11',
  '2026-12',
] as const;

export function newProjectId(): string {
  return `proj-user-${crypto.randomUUID()}`;
}

export function newBreakdownItemId(): string {
  return `wbs-user-${crypto.randomUUID()}`;
}

export function newAllocationId(): string {
  return `alloc-user-${crypto.randomUUID()}`;
}

export function validateProjectInput(input: {
  name: string;
  startDate: string;
  endDate: string;
}): string | undefined {
  if (!input.name.trim()) {
    return 'Project name is required';
  }
  if (!ISO_DATE.test(input.startDate) || !ISO_DATE.test(input.endDate)) {
    return 'Dates must be YYYY-MM-DD';
  }
  if (input.startDate > input.endDate) {
    return 'startDate must be on or before endDate';
  }
  return undefined;
}

export function validateBreakdownName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Breakdown item name is required';
  }
  return undefined;
}

export function sortProjects(projects: readonly Project[]): Project[] {
  // Preserve store / seed order (Ledger Migration / proj-001 first).
  return [...projects];
}

export function sortEmployees(employees: readonly Employee[]): Employee[] {
  // Preserve store / seed order (baseline lists emp-001 A. Okafor first).
  return [...employees];
}

export function allocationKey(
  breakdownItemId: string,
  employeeId: string,
  month: YearMonth,
): string {
  return `${breakdownItemId}|${employeeId}|${month}`;
}

export function indexAllocationsByCell(
  allocations: readonly CapacityAllocation[],
): Map<string, CapacityAllocation> {
  const map = new Map<string, CapacityAllocation>();
  for (const allocation of allocations) {
    map.set(
      allocationKey(
        allocation.breakdownItemId,
        allocation.employeeId,
        allocation.month,
      ),
      allocation,
    );
  }
  return map;
}

export function ratesForEmployee(
  rates: readonly RateRecord[],
  employeeId: string,
): RateRecord[] {
  return rates.filter((rate) => rate.employeeId === employeeId);
}

/** Cost of 1.0 PM for conversion when editing/displaying €. */
export function costPerPersonMonthForEmployee(
  employee: Employee,
  month: YearMonth,
  rates: readonly RateRecord[],
): { costPerPersonMonth: number; hasNoApplicableRate: boolean } {
  const result = calculateAllocationCost({
    amountPm: 1,
    weeklyHours: employee.weeklyHours,
    month,
    rates: ratesForEmployee(rates, employee.id),
  });
  return {
    costPerPersonMonth: result.cost,
    hasNoApplicableRate: result.hasNoApplicableRate,
  };
}

export function buildConversionContext(
  employee: Employee,
  month: YearMonth,
  rates: readonly RateRecord[],
): UnitConversionContext & { hasNoApplicableRate: boolean } {
  const { costPerPersonMonth, hasNoApplicableRate } =
    costPerPersonMonthForEmployee(employee, month, rates);
  return {
    weeklyHours: employee.weeklyHours,
    workingDaysInMonth: countWorkingDaysInMonth(month),
    costPerPersonMonth,
    hasNoApplicableRate,
  };
}

export function displayAmountForCell(input: {
  items: readonly BreakdownItem[];
  allocations: readonly CapacityAllocation[];
  breakdownItemId: string;
  employee: Employee;
  month: YearMonth;
  rates: readonly RateRecord[];
  unit: DisplayUnit;
}): { value: number; hasNoApplicableRate: boolean; amountPm: number } {
  const amountPm = sumLeafAllocationsPm(
    input.items,
    input.allocations,
    input.breakdownItemId,
    input.employee.id,
    input.month,
  );
  const ctx = buildConversionContext(
    input.employee,
    input.month,
    input.rates,
  );
  const value = fromCanonical(input.unit, amountPm, ctx);
  return {
    value,
    amountPm,
    hasNoApplicableRate: ctx.hasNoApplicableRate,
  };
}

export function formatDisplayValue(unit: DisplayUnit, value: number): string {
  return roundForDisplay(unit, value).toFixed(displayDecimals(unit));
}

export function parseDisplayInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return 0;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return undefined;
  return value;
}

export function validateDisplayAmount(value: number): string | undefined {
  if (!Number.isFinite(value) || value < 0) {
    return 'Allocation must be a non-negative number';
  }
  return undefined;
}

/** Near-zero PM treated as empty (remove allocation). */
export const ZERO_PM_EPSILON = 1e-9;

export function reconcileColumnTotals(
  cellValues: readonly number[],
  unit: DisplayUnit,
): number[] {
  return distributeLargestRemainder(cellValues, displayDecimals(unit));
}

export function firstLeafId(
  flat: readonly { item: BreakdownItem; isLeaf: boolean }[],
): string | null {
  const leaf = flat.find((node) => node.isLeaf);
  return leaf?.item.id ?? flat[0]?.item.id ?? null;
}
