import {
  openDeliveryDatabase,
  openPeopleDatabase,
} from '../db/openDatabase';
import { storeCount, storePutAll } from '../repositories/storeHelpers';
import type { BaselineFixture } from './fixtureTypes';
import { loadBaselineFixture } from './loadFixture';

export interface SeedResult {
  seeded: boolean;
  fixture: BaselineFixture;
}

/**
 * Seed People + Delivery IndexedDB from the committed fixture when empty.
 * Does not overwrite existing data and never regenerates entity IDs.
 */
export async function seedBaselineIfEmpty(
  fixture?: BaselineFixture,
): Promise<SeedResult> {
  const data = fixture ?? (await loadBaselineFixture());
  const peopleDb = await openPeopleDatabase();
  const deliveryDb = await openDeliveryDatabase();

  const employeeCount = await storeCount(peopleDb, 'employees');
  if (employeeCount > 0) {
    return { seeded: false, fixture: data };
  }

  await storePutAll(peopleDb, 'employees', data.employees);
  await storePutAll(peopleDb, 'rates', data.rates);
  await storePutAll(deliveryDb, 'projects', data.projects);
  await storePutAll(deliveryDb, 'breakdownItems', data.breakdownItems);
  await storePutAll(deliveryDb, 'allocations', data.allocations);

  return { seeded: true, fixture: data };
}
