import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeliveryDatabase,
  clearPeopleDatabase,
  createDeliveryRepositories,
  createPeopleRepositories,
} from '../../packages/data/src/index';

beforeEach(async () => {
  await clearPeopleDatabase();
  await clearDeliveryDatabase();
});

describe('people repositories', () => {
  it('persists employee CRUD', async () => {
    const { employees } = await createPeopleRepositories();
    await employees.upsert({
      id: 'emp-test',
      name: 'Test User',
      role: 'Engineer',
      weeklyHours: 40,
    });
    expect(await employees.get('emp-test')).toMatchObject({ name: 'Test User' });
    await employees.upsert({
      id: 'emp-test',
      name: 'Renamed',
      role: 'Engineer',
      weeklyHours: 32,
    });
    expect((await employees.get('emp-test'))?.weeklyHours).toBe(32);
    await employees.remove('emp-test');
    expect(await employees.get('emp-test')).toBeUndefined();
  });

  it('persists rate CRUD and listByEmployee', async () => {
    const { rates } = await createPeopleRepositories();
    await rates.upsert({
      id: 'rate-1',
      employeeId: 'emp-test',
      validFrom: '2025-01-01',
      hourlyCost: 80,
    });
    await rates.upsert({
      id: 'rate-2',
      employeeId: 'emp-other',
      validFrom: '2025-01-01',
      hourlyCost: 50,
    });
    expect(await rates.listByEmployee('emp-test')).toHaveLength(1);
    await rates.remove('rate-1');
    expect(await rates.count()).toBe(1);
  });
});

describe('delivery repositories', () => {
  it('persists projects, breakdown items, and allocations with updatedAt', async () => {
    const repos = await createDeliveryRepositories();
    await repos.projects.upsert({
      id: 'proj-1',
      name: 'Alpha',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    await repos.breakdownItems.upsert({
      id: 'wbs-1',
      projectId: 'proj-1',
      parentId: null,
      name: 'Root',
    });
    await repos.allocations.upsert({
      id: 'alloc-1',
      breakdownItemId: 'wbs-1',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.5,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(await repos.projects.count()).toBe(1);
    expect(await repos.breakdownItems.listByProject('proj-1')).toHaveLength(1);
    const listed = await repos.allocations.listByEmployeeMonth(
      'emp-1',
      '2026-03',
    );
    expect(listed).toHaveLength(1);
    expect(listed[0]?.updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
