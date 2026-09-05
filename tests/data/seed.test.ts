import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeliveryDatabase,
  clearPeopleDatabase,
  createDeliveryRepositories,
  createPeopleRepositories,
  loadBaselineFixture,
  seedBaselineIfEmpty,
} from '../../packages/data/src/index';

beforeEach(async () => {
  await clearPeopleDatabase();
  await clearDeliveryDatabase();
});

describe('baseline fixture seed', () => {
  it('loads fixture with expected counts and fixed IDs', async () => {
    const fixture = await loadBaselineFixture();
    expect(fixture.meta.strategy).toBe('generated-approved');
    expect(fixture.employees).toHaveLength(60);
    expect(fixture.rates).toHaveLength(150);
    expect(fixture.projects).toHaveLength(4);
    expect(fixture.breakdownItems).toHaveLength(90);
    expect(fixture.allocations).toHaveLength(720);
    expect(fixture.meta.counts.midMonthRateChanges).toBeGreaterThanOrEqual(10);
    expect(fixture.employees.some((e) => e.id === 'emp-okafor')).toBe(true);
    expect(fixture.employees.some((e) => e.id === 'emp-002')).toBe(true);
    expect(
      fixture.rates.some(
        (r) => r.employeeId === 'emp-okafor' && r.validFrom === '2026-03-12',
      ),
    ).toBe(true);
  });

  it('seeds empty databases once and preserves data on reload', async () => {
    const first = await seedBaselineIfEmpty();
    expect(first.seeded).toBe(true);

    const people = await createPeopleRepositories();
    const delivery = await createDeliveryRepositories();
    expect(await people.employees.count()).toBe(60);
    expect(await people.rates.count()).toBe(150);
    expect(await delivery.projects.count()).toBe(4);
    expect(await delivery.breakdownItems.count()).toBe(90);
    expect(await delivery.allocations.count()).toBe(720);
    expect((await people.employees.get('emp-okafor'))?.name).toBe('A. Okafor');
    expect((await people.employees.get('emp-002'))?.id).toBe('emp-002');

    const second = await seedBaselineIfEmpty();
    expect(second.seeded).toBe(false);
    expect(await people.employees.count()).toBe(60);
    expect(await delivery.allocations.count()).toBe(720);

    // Simulate reload with new repository handles against the same IndexedDB.
    const peopleReloaded = await createPeopleRepositories();
    const deliveryReloaded = await createDeliveryRepositories();
    expect(await peopleReloaded.employees.count()).toBe(60);
    expect(await deliveryReloaded.allocations.count()).toBe(720);
    expect((await peopleReloaded.employees.get('emp-okafor'))?.id).toBe(
      'emp-okafor',
    );
  });
});
