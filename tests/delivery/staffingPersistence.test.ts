import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeliveryDatabase,
  clearPeopleDatabase,
  createDeliveryRepositories,
  createPeopleRepositories,
  seedBaselineIfEmpty,
} from '../../packages/data/src/index';
import {
  canEditAllocationWhenOverCapacity,
  sumLeafAllocationsPm,
  summarizeEmployeeMonthCapacity,
  toCanonical,
} from '../../packages/domain/src/index';
import { buildConversionContext } from '../../apps/delivery/src/deliveryHelpers';

beforeEach(async () => {
  await clearPeopleDatabase();
  await clearDeliveryDatabase();
});

describe('staffing allocation persistence', () => {
  it('upserts leaf PM and keeps parent derived equal to children', async () => {
    const delivery = await createDeliveryRepositories();
    await delivery.projects.upsert({
      id: 'proj-1',
      name: 'Alpha',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    await delivery.breakdownItems.upsert({
      id: 'root',
      projectId: 'proj-1',
      parentId: null,
      name: 'Root',
    });
    await delivery.breakdownItems.upsert({
      id: 'leaf',
      projectId: 'proj-1',
      parentId: 'root',
      name: 'Leaf',
    });
    await delivery.allocations.upsert({
      id: 'alloc-1',
      breakdownItemId: 'leaf',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.5,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const items = await delivery.breakdownItems.list();
    const allocations = await delivery.allocations.list();
    expect(
      sumLeafAllocationsPm(items, allocations, 'leaf', 'emp-1', '2026-03'),
    ).toBe(0.5);
    expect(
      sumLeafAllocationsPm(items, allocations, 'root', 'emp-1', '2026-03'),
    ).toBe(0.5);

    await delivery.allocations.upsert({
      id: 'alloc-1',
      breakdownItemId: 'leaf',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.75,
      updatedAt: '2026-06-01T00:00:00.000Z',
    });
    const next = await delivery.allocations.list();
    expect(
      sumLeafAllocationsPm(items, next, 'root', 'emp-1', '2026-03'),
    ).toBe(0.75);
  });

  it('allows editing when over capacity', async () => {
    expect(canEditAllocationWhenOverCapacity()).toBe(true);
    const delivery = await createDeliveryRepositories();
    await delivery.allocations.upsert({
      id: 'a1',
      breakdownItemId: 'w1',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.7,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await delivery.allocations.upsert({
      id: 'a2',
      breakdownItemId: 'w2',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.5,
      updatedAt: '2026-02-01T00:00:00.000Z',
    });
    const summary = summarizeEmployeeMonthCapacity(
      await delivery.allocations.list(),
      'emp-1',
      '2026-03',
    );
    expect(summary.isOverCapacity).toBe(true);
    expect(canEditAllocationWhenOverCapacity()).toBe(true);
  });

  it('converts € edit using blended 1 PM cost then stores PM', async () => {
    await seedBaselineIfEmpty();
    const people = await createPeopleRepositories();
    const delivery = await createDeliveryRepositories();
    const okafor = await people.employees.get('emp-001');
    expect(okafor).toBeDefined();
    if (!okafor) return;
    const rates = await people.rates.listByEmployee('emp-001');
    const ctx = buildConversionContext(okafor, '2026-03', rates);
    const amountPm = toCanonical('Cost', 7880, ctx);
    expect(amountPm).toBeCloseTo(0.5, 5);

    await delivery.allocations.upsert({
      id: 'alloc-okafor-test',
      breakdownItemId: 'wbs-006',
      employeeId: 'emp-001',
      month: '2026-03',
      amount: amountPm,
      updatedAt: new Date().toISOString(),
    });
    const stored = await delivery.allocations.get('alloc-okafor-test');
    expect(stored?.amount).toBeCloseTo(0.5, 5);
  });
});
