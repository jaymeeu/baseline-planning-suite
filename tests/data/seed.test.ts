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

    const alphaLeafId = fixture.meta.demo?.alphaLeafId ?? 'wbs-006';
    const betaLeafId = fixture.meta.demo?.betaLeafId ?? 'wbs-028';
    const onAlpha = fixture.allocations.filter(
      (a) => a.breakdownItemId === alphaLeafId,
    );
    const onBeta = fixture.allocations.filter(
      (a) => a.breakdownItemId === betaLeafId,
    );
    expect(onAlpha.length).toBeGreaterThan(600);
    expect(onBeta.length).toBeGreaterThan(0);
    expect(onAlpha.length + onBeta.length).toBe(720);

    const okaforMarch = fixture.allocations.filter(
      (a) => a.employeeId === 'emp-okafor' && a.month === '2026-03',
    );
    expect(okaforMarch).toHaveLength(2);
    expect(new Set(okaforMarch.map((a) => a.breakdownItemId))).toEqual(
      new Set([alphaLeafId, betaLeafId]),
    );
    const okaforMarchPm = okaforMarch.reduce((sum, a) => sum + a.amount, 0);
    expect(okaforMarchPm).toBeGreaterThan(1);
    expect(fixture.meta.demo?.overcapacity.totalPm).toBe(okaforMarchPm);
  });

  it('seeded allocations produce cross-project overcapacity for emp-okafor / 2026-03', async () => {
    const { summarizeEmployeeMonthCapacity } = await import(
      '../../packages/domain/src/capacity'
    );
    const fixture = await loadBaselineFixture();
    const summary = summarizeEmployeeMonthCapacity(
      fixture.allocations,
      'emp-okafor',
      '2026-03',
    );
    expect(summary.isOverCapacity).toBe(true);
    expect(summary.totalPm).toBeCloseTo(1.1, 5);
    expect(summary.causingAllocationId).toBe('alloc-0720');
  });

  it('Phase 11: seeded Alpha cost, rate sensitivity, and overcapacity from seed', async () => {
    const {
      calculateAllocationCost,
      summarizeEmployeeMonthCapacity,
      summarizeAllCapacities,
    } = await import('../../packages/domain/src/index');
    const { oversubscribedEmployeeIds } = await import(
      '../../apps/people/src/peopleHelpers'
    );

    await seedBaselineIfEmpty();
    const people = await createPeopleRepositories();
    const delivery = await createDeliveryRepositories();
    const okafor = await people.employees.get('emp-okafor');
    expect(okafor?.weeklyHours).toBe(40);
    const rates = await people.rates.listByEmployee('emp-okafor');
    const alphaAlloc = (await delivery.allocations.list()).find(
      (a) =>
        a.employeeId === 'emp-okafor' &&
        a.month === '2026-03' &&
        a.breakdownItemId === 'wbs-006',
    );
    expect(alphaAlloc?.amount).toBeCloseTo(0.6, 5);

    const before = calculateAllocationCost({
      amountPm: alphaAlloc!.amount,
      weeklyHours: okafor!.weeklyHours,
      month: '2026-03',
      rates,
    });
    // 0.6 PM vs reference 0.5 → 1.2× of €7,880
    expect(before.cost).toBeCloseTo(7880 * 1.2, 2);

    const raisedRates = rates.map((r) =>
      r.validFrom === '2026-03-12' ? { ...r, hourlyCost: 100 } : r,
    );
    const after = calculateAllocationCost({
      amountPm: alphaAlloc!.amount,
      weeklyHours: okafor!.weeklyHours,
      month: '2026-03',
      rates: raisedRates,
    });
    expect(after.cost).toBeGreaterThan(before.cost);

    const allAllocations = await delivery.allocations.list();
    const summaries = summarizeAllCapacities(allAllocations);
    const march = summarizeEmployeeMonthCapacity(
      allAllocations,
      'emp-okafor',
      '2026-03',
    );
    expect(march.isOverCapacity).toBe(true);
    expect(oversubscribedEmployeeIds(summaries).has('emp-okafor')).toBe(true);

    const betaCells = allAllocations.filter(
      (a) => a.breakdownItemId === 'wbs-028',
    );
    expect(betaCells.length).toBeGreaterThan(50);
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
