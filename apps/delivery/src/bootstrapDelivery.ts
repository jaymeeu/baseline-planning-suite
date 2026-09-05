import {
  createDeliveryRepositories,
  createPeopleRepositories,
  seedBaselineIfEmpty,
  type DeliveryRepositories,
  type PeopleRepositories,
} from '@bps/data';

export interface DeliveryBootstrap {
  delivery: DeliveryRepositories;
  people: PeopleRepositories;
}

/**
 * Seed fixture once (if empty) and open Delivery + People repositories.
 * People is read-only here for employees/rates (Delivery must not own rate SoT).
 */
export async function bootstrapDelivery(): Promise<DeliveryBootstrap> {
  await seedBaselineIfEmpty();
  const delivery = await createDeliveryRepositories();
  const people = await createPeopleRepositories();
  return { delivery, people };
}
