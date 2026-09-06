import type { BaselineFixture } from './fixtureTypes';
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
 * Each side is checked independently. Does not overwrite existing data.
 */
export declare function seedBaselineIfEmpty(fixture?: BaselineFixture): Promise<SeedResult>;
