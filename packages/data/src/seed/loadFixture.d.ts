import type { BaselineFixture } from './fixtureTypes';
/**
 * Load the committed baseline fixture from split seeder files.
 * IDs are fixed in packages/data/seeder/*.json — never regenerated at runtime.
 */
export declare function loadBaselineFixture(): Promise<BaselineFixture>;
/** Fail fast if split seeder files drift out of sync. */
export declare function assertFixtureIntegrity(fixture: BaselineFixture): void;
