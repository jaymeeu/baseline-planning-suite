import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDeliveryDatabase,
  clearPeopleDatabase,
} from '../../packages/data/src/index';
import { bootstrapPeople } from '../../apps/people/src/bootstrapPeople';

beforeEach(async () => {
  await clearPeopleDatabase();
  await clearDeliveryDatabase();
});

describe('People bootstrap', () => {
  it('seeds fixture and lists 60 employees', async () => {
    const { people } = await bootstrapPeople();
    const employees = await people.employees.list();
    expect(employees).toHaveLength(60);
    expect(employees.some((e) => e.id === 'emp-okafor')).toBe(true);
  });
});
