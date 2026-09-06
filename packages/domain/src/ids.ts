/**
 * ID helpers — fixture integrity.
 * Domain code must not mint entity IDs. Seeds and repositories own ID assignment
 * and must preserve fixed fixture IDs across reloads.
 */

import type { Id } from './types';

export function isId(value: unknown): value is Id {
  return typeof value === 'string' && value.length > 0;
}

export function assertId(value: unknown, label = 'id'): Id {
  if (!isId(value)) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
