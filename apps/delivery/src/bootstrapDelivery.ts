import {
  createDeliveryRepositories,
  seedBaselineIfEmpty,
  type DeliveryRepositories,
} from '@bps/data';

export interface DeliveryBootstrap {
  delivery: DeliveryRepositories;
}

/**
 * Seed fixture once (if empty) and open Delivery repositories.
 */
export async function bootstrapDelivery(): Promise<DeliveryBootstrap> {
  await seedBaselineIfEmpty();
  const delivery = await createDeliveryRepositories();
  return { delivery };
}
