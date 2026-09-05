import { describe, expect, it } from 'vitest';
import type { EmployeeMonthCapacity } from '../../packages/domain/src/index';
import {
  capacityForEmployee,
  oversubscribedEmployeeIds,
  validateRateInput,
} from '../../apps/people/src/peopleHelpers';

const summaries: EmployeeMonthCapacity[] = [
  {
    employeeId: 'emp-1',
    month: '2026-03',
    totalPm: 0.5,
    capacityPercent: 50,
    isOverCapacity: false,
    causingAllocationId: undefined,
    allocationIds: ['a1'],
  },
  {
    employeeId: 'emp-2',
    month: '2026-03',
    totalPm: 1.2,
    capacityPercent: 120,
    isOverCapacity: true,
    causingAllocationId: 'a2',
    allocationIds: ['a2'],
  },
  {
    employeeId: 'emp-2',
    month: '2026-04',
    totalPm: 0.3,
    capacityPercent: 30,
    isOverCapacity: false,
    causingAllocationId: undefined,
    allocationIds: ['a3'],
  },
];

describe('oversubscribed helpers', () => {
  it('marks employees with any over-capacity month', () => {
    const ids = oversubscribedEmployeeIds(summaries);
    expect(ids.has('emp-1')).toBe(false);
    expect(ids.has('emp-2')).toBe(true);
  });

  it('returns sorted capacity rows for one employee', () => {
    const rows = capacityForEmployee(summaries, 'emp-2');
    expect(rows.map((r) => r.month)).toEqual(['2026-03', '2026-04']);
  });
});

describe('validateRateInput', () => {
  it('accepts valid retroactive dates', () => {
    expect(
      validateRateInput({ validFrom: '2020-06-15', hourlyCost: 80 }),
    ).toBeUndefined();
  });

  it('rejects bad dates and negative cost', () => {
    expect(validateRateInput({ validFrom: '2020-6-15', hourlyCost: 80 })).toMatch(
      /validFrom/,
    );
    expect(validateRateInput({ validFrom: '2020-06-15', hourlyCost: -1 })).toMatch(
      /hourlyCost/,
    );
  });
});
