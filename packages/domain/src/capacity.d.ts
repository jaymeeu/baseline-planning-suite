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
/**
 * Over-capacity must be flagged, never blocked.
 * Application layers should always allow edits when this returns true.
 */
export declare function canEditAllocationWhenOverCapacity(): true;
/**
 * Summarize capacity for one employee/month.
 * Pass allocations from **all** projects — do not pre-filter by open/selected project.
 */
export declare function summarizeEmployeeMonthCapacity(allocations: readonly CapacityAllocation[], employeeId: Id, month: YearMonth): EmployeeMonthCapacity;
/**
 * Summarize every employee/month key present in the allocation set.
 */
export declare function summarizeAllCapacities(allocations: readonly CapacityAllocation[]): readonly EmployeeMonthCapacity[];
