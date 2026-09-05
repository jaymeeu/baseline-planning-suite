import type { BaselineFixture } from './fixtureTypes';

/**
 * Load the committed baseline fixture.
 * IDs are fixed in fixtures/baseline.json — never regenerated at runtime.
 */
export async function loadBaselineFixture(): Promise<BaselineFixture> {
  const module = await import('../../../../fixtures/baseline.json');
  return module.default as BaselineFixture;
}
