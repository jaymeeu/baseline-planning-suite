import type { BaselineFixture } from './fixtureTypes';
/**
 * Load the committed baseline fixture.
 * IDs are fixed in fixtures/baseline.json — never regenerated at runtime.
 */
export declare function loadBaselineFixture(): Promise<BaselineFixture>;
