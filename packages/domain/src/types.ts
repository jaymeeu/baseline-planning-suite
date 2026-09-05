/**
 * Opaque entity identifier.
 * Fixture and repository layers must persist provided IDs — never regenerate on load.
 * This package intentionally exports no create*Id() factories.
 */
export type Id = string;

/** Calendar date as ISO `YYYY-MM-DD`. */
export type IsoDate = string;

/** Calendar month as ISO `YYYY-MM`. */
export type YearMonth = string;

/** Allowed employee weekly contracted hours. */
export type WeeklyHours = 40 | 32 | 20;

/** Display/edit units at UI boundaries. Stored allocations always use PM. */
export type DisplayUnit = 'PM' | 'Hours' | 'Percent' | 'Cost';

export interface Employee {
  id: Id;
  name: string;
  role: string;
  weeklyHours: WeeklyHours;
}

/**
 * Effective-dated hourly cost for an employee.
 * `validFrom` is inclusive. There is no end date — a rate applies until the next rate's validFrom.
 */
export interface RateRecord {
  id: Id;
  employeeId: Id;
  validFrom: IsoDate;
  hourlyCost: number;
}

export interface Project {
  id: Id;
  name: string;
  startDate: IsoDate;
  endDate: IsoDate;
}

/**
 * Work breakdown structure node.
 * Root items have `parentId = null`. Maximum depth is 3 (root = depth 1).
 */
export interface BreakdownItem {
  id: Id;
  projectId: Id;
  parentId: Id | null;
  name: string;
}

/**
 * Staffing allocation for one leaf breakdown item, employee, and month.
 * `amount` is always stored in person-months (canonical unit).
 */
export interface Allocation {
  id: Id;
  breakdownItemId: Id;
  employeeId: Id;
  month: YearMonth;
  /** Person-months. Convert to Hours / Percent / Cost only at display/edit boundaries. */
  amount: number;
}
