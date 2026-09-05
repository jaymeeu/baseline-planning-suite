import type { DisplayUnit } from './types';

/** Display decimal places by unit. */
export function displayDecimals(unit: DisplayUnit): number {
  switch (unit) {
    case 'Percent':
      return 1;
    case 'PM':
    case 'Hours':
    case 'Cost':
      return 2;
    default: {
      const _exhaustive: never = unit;
      throw new Error(`Unsupported display unit: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Round a single value for display (does not reconcile totals).
 */
export function roundForDisplay(unit: DisplayUnit, value: number): number {
  const decimals = displayDecimals(unit);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Largest-remainder distribution so rounded parts sum exactly to the rounded total
 * at the given decimal scale. Values may be negative; remainders use absolute
 * fractional parts with sign preserved on floors.
 */
export function distributeLargestRemainder(
  values: readonly number[],
  decimals: number,
): number[] {
  if (values.length === 0) return [];
  if (!(decimals >= 0) || !Number.isInteger(decimals)) {
    throw new Error('decimals must be a non-negative integer');
  }

  const scale = 10 ** decimals;
  const exactSum = values.reduce((sum, value) => sum + value, 0);
  const target = Math.round(exactSum * scale);

  const scaled = values.map((value) => value * scale);
  const floors = scaled.map((value) => Math.floor(value));
  let allocated = floors.reduce((sum, value) => sum + value, 0);
  let remaining = target - allocated;

  const order = scaled
    .map((value, index) => ({
      index,
      frac: value - floors[index]!,
    }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);

  const result = [...floors];
  let cursor = 0;
  while (remaining > 0 && order.length > 0) {
    const slot = order[cursor % order.length]!;
    result[slot.index] = (result[slot.index] ?? 0) + 1;
    remaining -= 1;
    cursor += 1;
  }
  while (remaining < 0 && order.length > 0) {
    const slot = order[(order.length - 1 - (cursor % order.length) + order.length) % order.length]!;
    result[slot.index] = (result[slot.index] ?? 0) - 1;
    remaining += 1;
    cursor += 1;
  }

  return result.map((value) => value / scale);
}
