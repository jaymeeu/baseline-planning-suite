import type { BaselineFixture } from './fixtureTypes';
/**
 * Load the committed baseline fixture from fixtures/seed-data.json.
 * IDs are fixed in that file — never regenerated at runtime.
 */
export declare function loadBaselineFixture(): Promise<BaselineFixture>;
/** Fail fast if fixture collections drift out of sync with meta.counts. */
export declare function assertFixtureIntegrity(fixture: BaselineFixture): void;
