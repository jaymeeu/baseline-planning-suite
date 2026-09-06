import type { BreakdownItem, CapacityAllocation, Employee, Project, RateRecord, YearMonth } from '@bps/domain';
/**
 * Approved fixture strategy: generated with fixed IDs
 * (see AGENTS.md / scripts/generate-fixture.mjs → seeder/*.json).
 */
export interface BaselineFixture {
    meta: {
        strategy: 'generated-approved';
        note: string;
        horizon: YearMonth[];
        /** Seeded demo hooks for capacity / overcapacity verification. */
        demo?: {
            overcapacity: {
                employeeId: string;
                month: YearMonth;
                totalPm: number;
                projects: string[];
                causingAllocationId?: string;
                slices?: Array<{
                    projectId: string;
                    breakdownItemId: string;
                    amountPm: number;
                    allocationId: string;
                }>;
            };
            alphaLeafId: string;
            betaLeafId: string;
            gammaLeafId?: string;
            deltaLeafId?: string;
            allocationsOnAlphaLeaf?: number;
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
