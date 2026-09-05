import type { Employee, EmployeeMonthCapacity } from '@bps/domain';

export function filterEmployees(
  employees: readonly Employee[],
  query: string,
): Employee[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...employees];
  }
  return employees.filter((employee) => {
    const haystack = `${employee.name} ${employee.role}`.toLowerCase();
    return haystack.includes(normalized);
  });
}

/** Employees with at least one over-capacity month across all projects. */
export function oversubscribedEmployeeIds(
  summaries: readonly EmployeeMonthCapacity[],
): Set<string> {
  const ids = new Set<string>();
  for (const summary of summaries) {
    if (summary.isOverCapacity) {
      ids.add(summary.employeeId);
    }
  }
  return ids;
}

export function capacityForEmployee(
  summaries: readonly EmployeeMonthCapacity[],
  employeeId: string,
): EmployeeMonthCapacity[] {
  return summaries
    .filter((summary) => summary.employeeId === employeeId)
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateRateInput(input: {
  validFrom: string;
  hourlyCost: number;
}): string | undefined {
  if (!ISO_DATE.test(input.validFrom)) {
    return 'validFrom must be YYYY-MM-DD';
  }
  if (!(input.hourlyCost >= 0) || Number.isNaN(input.hourlyCost)) {
    return 'hourlyCost must be a non-negative number';
  }
  return undefined;
}

export function newRateId(): string {
  return `rate-user-${crypto.randomUUID()}`;
}
