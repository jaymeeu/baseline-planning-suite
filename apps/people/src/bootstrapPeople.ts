import {
  createDeliveryRepositories,
  createPeopleRepositories,
  seedBaselineIfEmpty,
  type DeliveryRepositories,
  type PeopleRepositories,
} from '@bps/data';

export interface PeopleBootstrap {
  people: PeopleRepositories;
  delivery: DeliveryRepositories;
}

/**
 * Seed fixture once (if empty) and open People + Delivery repositories.
 * Delivery allocations are read-only here for cross-project capacity.
 */
export async function bootstrapPeople(): Promise<PeopleBootstrap> {
  await seedBaselineIfEmpty();
  const people = await createPeopleRepositories();
  const delivery = await createDeliveryRepositories();
  return { people, delivery };
}
