import { describe, expect, it } from 'vitest';
import {
  displayDecimals,
  distributeLargestRemainder,
  roundForDisplay,
} from '../../packages/domain/src/index';

describe('display precision', () => {
  it('uses required decimal places', () => {
    expect(displayDecimals('PM')).toBe(2);
    expect(displayDecimals('Hours')).toBe(2);
    expect(displayDecimals('Cost')).toBe(2);
    expect(displayDecimals('Percent')).toBe(1);
  });

  it('rounds single values for display', () => {
    expect(roundForDisplay('PM', 0.456)).toBe(0.46);
    expect(roundForDisplay('Percent', 33.36)).toBe(33.4);
    expect(roundForDisplay('Cost', 7880.004)).toBe(7880);
  });
});

describe('distributeLargestRemainder', () => {
  it('makes rounded parts sum to the rounded total', () => {
    const values = [1 / 3, 1 / 3, 1 / 3];
    const rounded = distributeLargestRemainder(values, 2);
    const sumParts = rounded.reduce((a, b) => a + b, 0);
    expect(sumParts).toBeCloseTo(1, 10);
    expect(rounded.every((v) => v === 0.33 || v === 0.34)).toBe(true);
    expect(rounded.filter((v) => v === 0.34)).toHaveLength(1);
    expect(rounded.filter((v) => v === 0.33)).toHaveLength(2);
  });

  it('handles already-exact totals', () => {
    expect(distributeLargestRemainder([1.25, 2.5], 2)).toEqual([1.25, 2.5]);
  });
});
