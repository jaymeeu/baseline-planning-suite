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
    expect(fixture.employees[0]?.id).toBe('emp-001');
    expect(fixture.employees[0]?.name).toBe('A. Okafor');
    expect(fixture.employees.some((e) => e.id === 'emp-002')).toBe(true);
    expect(
      fixture.rates.some(
        (r) => r.employeeId === 'emp-001' && r.validFrom === '2026-03-12',
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
    expect(onAlpha.length).toBe(180);
    expect(onBeta.length).toBe(180);
    expect(fixture.allocations).toHaveLength(720);

    const okaforMarch = fixture.allocations.filter(
      (a) => a.employeeId === 'emp-001' && a.month === '2026-03',
    );
    expect(okaforMarch).toHaveLength(2);
    expect(new Set(okaforMarch.map((a) => a.breakdownItemId))).toEqual(
      new Set([alphaLeafId, betaLeafId]),
    );
    const okaforMarchPm = okaforMarch.reduce((sum, a) => sum + a.amount, 0);
    expect(okaforMarchPm).toBeCloseTo(1.1, 5);
    expect(fixture.meta.demo?.overcapacity.totalPm).toBe(okaforMarchPm);
  });

  it('seeded allocations produce cross-project overcapacity for emp-001 / 2026-03', async () => {
    const { summarizeEmployeeMonthCapacity } = await import(
      '../../packages/domain/src/capacity'
    );
    const fixture = await loadBaselineFixture();
    const summary = summarizeEmployeeMonthCapacity(
      fixture.allocations,
      'emp-001',
      '2026-03',
    );
    expect(summary.isOverCapacity).toBe(true);
    expect(summary.totalPm).toBeCloseTo(1.1, 5);
    expect(summary.causingAllocationId).toBe(
      fixture.meta.demo?.overcapacity.causingAllocationId,
    );
  });

  it('Phase 11: seeded Ledger cost, rate sensitivity, and overcapacity from seed', async () => {
    const {
      calculateAllocationCost,
      summarizeEmployeeMonthCapacity,
      summarizeAllCapacities,
    } = await import('../../packages/domain/src/index');
    const { oversubscribedEmployeeIds } = await import(
      '../../apps/people/src/peopleHelpers'
    );

    const fixture = await loadBaselineFixture();
    await seedBaselineIfEmpty(fixture);
    const people = await createPeopleRepositories();
    const delivery = await createDeliveryRepositories();
    const okafor = await people.employees.get('emp-001');
    expect(okafor?.weeklyHours).toBe(40);
    const rates = await people.rates.listByEmployee('emp-001');
    const alphaLeafId = fixture.meta.demo?.alphaLeafId;
    const betaLeafId = fixture.meta.demo?.betaLeafId;
    expect(alphaLeafId).toBeTruthy();
    expect(betaLeafId).toBeTruthy();
    const alphaAlloc = (await delivery.allocations.list()).find(
      (a) =>
        a.employeeId === 'emp-001' &&
        a.month === '2026-03' &&
        a.breakdownItemId === alphaLeafId,
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
      'emp-001',
      '2026-03',
    );
    expect(march.isOverCapacity).toBe(true);
    expect(oversubscribedEmployeeIds(summaries).has('emp-001')).toBe(true);

    const betaCells = allAllocations.filter(
      (a) => a.breakdownItemId === betaLeafId,
    );
    expect(betaCells.length).toBe(180);
  });

  it('seeds empty databases once and preserves data on reload', async () => {
    const first = await seedBaselineIfEmpty();
    expect(first.seeded).toBe(true);
    expect(first.seededPeople).toBe(true);
    expect(first.seededDelivery).toBe(true);

    const people = await createPeopleRepositories();
    const delivery = await createDeliveryRepositories();
    expect(await people.employees.count()).toBe(60);
    expect(await people.rates.count()).toBe(150);
    expect(await delivery.projects.count()).toBe(4);
    expect(await delivery.breakdownItems.count()).toBe(90);
    expect(await delivery.allocations.count()).toBe(720);
    expect((await people.employees.get('emp-001'))?.name).toBe('A. Okafor');
    expect((await people.employees.get('emp-002'))?.id).toBe('emp-002');

    const second = await seedBaselineIfEmpty();
    expect(second.seeded).toBe(false);
    expect(second.seededPeople).toBe(false);
    expect(second.seededDelivery).toBe(false);
    expect(await people.employees.count()).toBe(60);
    expect(await delivery.allocations.count()).toBe(720);

    const peopleReloaded = await createPeopleRepositories();
    const deliveryReloaded = await createDeliveryRepositories();
    expect(await peopleReloaded.employees.count()).toBe(60);
    expect(await deliveryReloaded.allocations.count()).toBe(720);
    expect((await peopleReloaded.employees.get('emp-001'))?.id).toBe('emp-001');
  });

  it('seeds Delivery when People is already populated (standalone Delivery case)', async () => {
    const first = await seedBaselineIfEmpty();
    expect(first.seededPeople).toBe(true);
    expect(first.seededDelivery).toBe(true);

    await clearDeliveryDatabase();
    const deliveryEmpty = await createDeliveryRepositories();
    expect(await deliveryEmpty.projects.count()).toBe(0);

    const peopleStillThere = await createPeopleRepositories();
    expect(await peopleStillThere.employees.count()).toBe(60);

    const second = await seedBaselineIfEmpty();
    expect(second.seeded).toBe(true);
    expect(second.seededPeople).toBe(false);
    expect(second.seededDelivery).toBe(true);

    const delivery = await createDeliveryRepositories();
    expect(await delivery.projects.count()).toBe(4);
    expect(await delivery.allocations.count()).toBe(720);
  });
});
