import type { BaselineFixture } from './fixtureTypes';

type JsonModule<T> = { default: T };

/**
 * Load the committed baseline fixture from fixtures/seed-data.json.
 * IDs are fixed in that file — never regenerated at runtime.
 */
export async function loadBaselineFixture(): Promise<BaselineFixture> {
  const mod = (await import('../../../../fixtures/seed-data.json')) as JsonModule<BaselineFixture>;
  const fixture = mod.default;
  assertFixtureIntegrity(fixture);
  return fixture;
}

/** Fail fast if fixture collections drift out of sync with meta.counts. */
export function assertFixtureIntegrity(fixture: BaselineFixture): void {
  const { counts } = fixture.meta;
  const checks: Array<[string, number, number]> = [
    ['employees', fixture.employees.length, counts.employees],
    ['rates', fixture.rates.length, counts.rates],
    ['projects', fixture.projects.length, counts.projects],
    ['breakdownItems', fixture.breakdownItems.length, counts.breakdownItems],
    ['allocations', fixture.allocations.length, counts.allocations],
  ];

  for (const [label, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(
        `Fixture integrity: ${label} length ${actual} !== meta.counts.${label} ${expected}`,
      );
    }
  }

  const employeeIds = new Set(fixture.employees.map((e) => e.id));
  for (const rate of fixture.rates) {
    if (!employeeIds.has(rate.employeeId)) {
      throw new Error(
        `Fixture integrity: rate ${rate.id} references missing employee ${rate.employeeId}`,
      );
    }
  }

  const projectIds = new Set(fixture.projects.map((p) => p.id));
  const itemIds = new Set(fixture.breakdownItems.map((i) => i.id));
  for (const item of fixture.breakdownItems) {
    if (!projectIds.has(item.projectId)) {
      throw new Error(
        `Fixture integrity: WBS ${item.id} references missing project ${item.projectId}`,
      );
    }
    if (item.parentId !== null && !itemIds.has(item.parentId)) {
      throw new Error(
        `Fixture integrity: WBS ${item.id} references missing parent ${item.parentId}`,
      );
    }
  }

  for (const allocation of fixture.allocations) {
    if (!employeeIds.has(allocation.employeeId)) {
      throw new Error(
        `Fixture integrity: allocation ${allocation.id} references missing employee ${allocation.employeeId}`,
      );
    }
    if (!itemIds.has(allocation.breakdownItemId)) {
      throw new Error(
        `Fixture integrity: allocation ${allocation.id} references missing WBS ${allocation.breakdownItemId}`,
      );
    }
  }
}
