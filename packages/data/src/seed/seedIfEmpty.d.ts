import type { BaselineFixture } from './fixtureTypes';
export interface SeedResult {
    seeded: boolean;
    fixture: BaselineFixture;
}
/**
 * Seed People + Delivery IndexedDB from the committed fixture when empty.
 * Does not overwrite existing data and never regenerates entity IDs.
 */
export declare function seedBaselineIfEmpty(fixture?: BaselineFixture): Promise<SeedResult>;
