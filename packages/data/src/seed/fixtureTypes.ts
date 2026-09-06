import type {
  BreakdownItem,
  CapacityAllocation,
  Employee,
  Project,
  RateRecord,
  YearMonth,
} from '@bps/domain';

/**
 * Approved fixture strategy: generated with fixed IDs
 * (see AGENTS.md / scripts/generate-fixture.mjs → packages/data/seeder/*.json).
 */
export interface BaselineFixture {
  meta: {
    strategy: 'generated-approved';
    note: string;
    horizon: YearMonth[];
    /** Seeded demo hooks for Phase 11 capacity / overcapacity verification. */
    demo?: {
      overcapacity: {
        employeeId: string;
        month: YearMonth;
        totalPm: number;
        projects: string[];
      };
      betaLeafId: string;
      alphaLeafId: string;
      allocationsOnBetaLeaf: number;
    };
    counts: {
      employees: number;
      rates: number;
      midMonthRateChanges: number;
      projects: number;
      breakdownItems: number;
      leafBreakdownItems: number;
      allocations: number;
    };
  };
  employees: Employee[];
  rates: RateRecord[];
  projects: Project[];
  breakdownItems: BreakdownItem[];
  allocations: CapacityAllocation[];
}
