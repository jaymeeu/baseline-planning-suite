import type { Allocation, Id, YearMonth } from './types';

/**
 * Allocation plus edit metadata for capacity / cause detection.
 * Repositories (Phase 4+) set `updatedAt` on write.
 */
export interface CapacityAllocation extends Allocation {
  /** ISO-8601 timestamp; later value wins for “most recently edited”. */
  updatedAt: string;
}

export interface EmployeeMonthCapacity {
  employeeId: Id;
  month: YearMonth;
  /** Sum of allocation.amount (PM) across all provided allocations for this key. */
  totalPm: number;
  /** totalPm × 100 — 100 = full monthly capacity. */
  capacityPercent: number;
  isOverCapacity: boolean;
  /** Set when over capacity; otherwise undefined. */
  causingAllocationId: Id | undefined;
  allocationIds: readonly Id[];
}

function compareCause(a: CapacityAllocation, b: CapacityAllocation): number {
  if (a.updatedAt > b.updatedAt) return -1;
  if (a.updatedAt < b.updatedAt) return 1;
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Over-capacity must be flagged, never blocked.
 * Application layers should always allow edits when this returns true.
 */
export function canEditAllocationWhenOverCapacity(): true {
  return true;
}

/**
 * Summarize capacity for one employee/month.
 * Pass allocations from **all** projects — do not pre-filter by open/selected project.
 */
export function summarizeEmployeeMonthCapacity(
  allocations: readonly CapacityAllocation[],
  employeeId: Id,
  month: YearMonth,
): EmployeeMonthCapacity {
  const matching = allocations.filter(
    (allocation) =>
      allocation.employeeId === employeeId && allocation.month === month,
  );

  const totalPm = matching.reduce((sum, allocation) => sum + allocation.amount, 0);
  const capacityPercent = totalPm * 100;
  const isOverCapacity = totalPm > 1;
  const allocationIds = matching.map((allocation) => allocation.id);

  let causingAllocationId: Id | undefined;
  if (isOverCapacity) {
    const contributors = matching.filter((allocation) => allocation.amount !== 0);
    if (contributors.length > 0) {
      const sorted = [...contributors].sort(compareCause);
      causingAllocationId = sorted[0]?.id;
    }
  }

  return {
    employeeId,
    month,
    totalPm,
    capacityPercent,
    isOverCapacity,
    causingAllocationId,
    allocationIds,
  };
}

/**
 * Summarize every employee/month key present in the allocation set.
 */
export function summarizeAllCapacities(
  allocations: readonly CapacityAllocation[],
): readonly EmployeeMonthCapacity[] {
  const keys = new Map<string, { employeeId: Id; month: YearMonth }>();

  for (const allocation of allocations) {
    const key = `${allocation.employeeId}::${allocation.month}`;
    if (!keys.has(key)) {
      keys.set(key, {
        employeeId: allocation.employeeId,
        month: allocation.month,
      });
    }
  }

  return [...keys.values()]
    .map(({ employeeId, month }) =>
      summarizeEmployeeMonthCapacity(allocations, employeeId, month),
    )
    .sort((a, b) => {
      if (a.employeeId < b.employeeId) return -1;
      if (a.employeeId > b.employeeId) return 1;
      if (a.month < b.month) return -1;
      if (a.month > b.month) return 1;
      return 0;
    });
}
