import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeliveryDatabase,
  clearPeopleDatabase,
  createDeliveryRepositories,
  seedBaselineIfEmpty,
} from '../../packages/data/src/index';
import {
  collectSubtreeIds,
  planInsertChildWithAllocations,
} from '../../packages/domain/src/index';

beforeEach(async () => {
  await clearPeopleDatabase();
  await clearDeliveryDatabase();
});

describe('allocation listByBreakdownItemId', () => {
  it('returns allocations for a breakdown item', async () => {
    const repos = await createDeliveryRepositories();
    await repos.breakdownItems.upsert({
      id: 'wbs-a',
      projectId: 'proj-1',
      parentId: null,
      name: 'A',
    });
    await repos.allocations.upsert({
      id: 'alloc-a',
      breakdownItemId: 'wbs-a',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.5,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    await repos.allocations.upsert({
      id: 'alloc-b',
      breakdownItemId: 'wbs-other',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.2,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const listed = await repos.allocations.listByBreakdownItemId('wbs-a');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe('alloc-a');
  });
});

describe('insert child moves allocations (persistence)', () => {
  it('reassigns allocations from leaf parent to new child and clears parent', async () => {
    const repos = await createDeliveryRepositories();
    await repos.projects.upsert({
      id: 'proj-1',
      name: 'Alpha',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    });
    await repos.breakdownItems.upsert({
      id: 'wbs-leaf',
      projectId: 'proj-1',
      parentId: null,
      name: 'Leaf',
    });
    await repos.allocations.upsert({
      id: 'alloc-1',
      breakdownItemId: 'wbs-leaf',
      employeeId: 'emp-1',
      month: '2026-03',
      amount: 0.5,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const items = await repos.breakdownItems.list();
    const parentAllocations =
      await repos.allocations.listByBreakdownItemId('wbs-leaf');
    const plan = planInsertChildWithAllocations({
      items,
      parentId: 'wbs-leaf',
      childId: 'wbs-child',
      childName: 'Child',
      parentAllocations,
      updatedAt: '2026-06-01T00:00:00.000Z',
    });

    await repos.breakdownItems.upsert(plan.newChild);
    for (const allocation of plan.reassignedAllocations) {
      await repos.allocations.upsert(allocation);
    }

    expect(await repos.allocations.listByBreakdownItemId('wbs-leaf')).toEqual(
      [],
    );
    const onChild = await repos.allocations.listByBreakdownItemId('wbs-child');
    expect(onChild).toHaveLength(1);
    expect(onChild[0]?.amount).toBe(0.5);
  });
});

describe('delete cascade removes allocations', () => {
  it('removes subtree items and their allocations', async () => {
    await seedBaselineIfEmpty();
    const repos = await createDeliveryRepositories();
    const items = await repos.breakdownItems.listByProject('proj-001');
    const target =
      items.find((item) => item.id === 'wbs-006') ??
      items.find((item) => item.parentId !== null);
    expect(target).toBeDefined();
    if (!target) return;

    const parentId = target.parentId ?? target.id;
    const subtree = collectSubtreeIds(items, parentId);
    for (const id of subtree) {
      const attached = await repos.allocations.listByBreakdownItemId(id);
      for (const allocation of attached) {
        await repos.allocations.remove(allocation.id);
      }
      await repos.breakdownItems.remove(id);
    }

    for (const id of subtree) {
      expect(await repos.breakdownItems.get(id)).toBeUndefined();
      expect(await repos.allocations.listByBreakdownItemId(id)).toEqual([]);
    }
  });
});
