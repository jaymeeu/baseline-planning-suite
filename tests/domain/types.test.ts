import { describe, expect, it } from 'vitest';
import type {
  Allocation,
  BreakdownItem,
  Employee,
  Project,
  RateRecord,
} from '../../packages/domain/src/index';
import * as domain from '../../packages/domain/src/index';

describe('domain types', () => {
  it('accepts well-formed entities without React', () => {
    const employee: Employee = {
      id: 'emp-1',
      name: 'A. Okafor',
      role: 'Engineer',
      weeklyHours: 40,
    };
    const rate: RateRecord = {
      id: 'rate-1',
      employeeId: employee.id,
      validFrom: '2025-01-01',
      hourlyCost: 80,
    };
    const project: Project = {
      id: 'proj-1',
      name: 'Alpha',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    };
    const root: BreakdownItem = {
      id: 'wbs-1',
      projectId: project.id,
      parentId: null,
      name: 'Root',
    };
    const allocation: Allocation = {
      id: 'alloc-1',
      breakdownItemId: root.id,
      employeeId: employee.id,
      month: '2026-03',
      amount: 0.5,
    };

    expect(employee.weeklyHours).toBe(40);
    expect(rate.validFrom).toBe('2025-01-01');
    expect(root.parentId).toBeNull();
    expect(allocation.amount).toBe(0.5);
  });

  it('does not export entity ID factories (fixture IDs must be preserved)', () => {
    const factoryLike = Object.keys(domain).filter((key) =>
      /^create\w*Id$/i.test(key),
    );
    expect(factoryLike).toEqual([]);
  });
});
