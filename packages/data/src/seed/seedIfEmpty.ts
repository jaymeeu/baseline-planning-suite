import {
  openDeliveryDatabase,
  openPeopleDatabase,
} from '../db/openDatabase';
import { storeCount, storePutAll } from '../repositories/storeHelpers';
import type { BaselineFixture } from './fixtureTypes';
import { loadBaselineFixture } from './loadFixture';

export interface SeedResult {
  seeded: boolean;
  /** True when People stores were empty and received fixture rows. */
  seededPeople: boolean;
  /** True when Delivery stores were empty and received fixture rows. */
  seededDelivery: boolean;
  fixture: BaselineFixture;
}

/**
 * Seed People and/or Delivery IndexedDB from the committed fixture when empty.
 *
 * Each side is checked independently so standalone Delivery still seeds projects
 * if People was already populated on this origin (and vice versa).
 * Does not overwrite existing data and never regenerates entity IDs.
 */
export async function seedBaselineIfEmpty(
  fixture?: BaselineFixture,
): Promise<SeedResult> {
  const data = fixture ?? (await loadBaselineFixture());
  const peopleDb = await openPeopleDatabase();
  const deliveryDb = await openDeliveryDatabase();

  const employeeCount = await storeCount(peopleDb, 'employees');
  const projectCount = await storeCount(deliveryDb, 'projects');

  let seededPeople = false;
  let seededDelivery = false;

  if (employeeCount === 0) {
    await storePutAll(peopleDb, 'employees', data.employees);
    await storePutAll(peopleDb, 'rates', data.rates);
    seededPeople = true;
  }

  if (projectCount === 0) {
    await storePutAll(deliveryDb, 'projects', data.projects);
    await storePutAll(deliveryDb, 'breakdownItems', data.breakdownItems);
    await storePutAll(deliveryDb, 'allocations', data.allocations);
    seededDelivery = true;
  }

  return {
    seeded: seededPeople || seededDelivery,
    seededPeople,
    seededDelivery,
    fixture: data,
  };
}
