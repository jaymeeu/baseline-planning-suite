/**
 * ID helpers — fixture integrity.
 * Domain code must not mint entity IDs. Seeds and repositories own ID assignment
 * and must preserve fixed fixture IDs across reloads.
 */
import type { Id } from './types';
export declare function isId(value: unknown): value is Id;
export declare function assertId(value: unknown, label?: string): Id;
