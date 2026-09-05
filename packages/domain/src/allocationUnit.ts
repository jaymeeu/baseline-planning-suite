import type { DisplayUnit, WeeklyHours } from './types';

export interface UnitConversionContext {
  weeklyHours: WeeklyHours;
  /** Caller supplies working-day count (Phase 2 computes the calendar). */
  workingDaysInMonth: number;
  /** Required when converting to/from Cost: cost of 1.0 PM for that employee/month. */
  costPerPersonMonth?: number;
}

export class UnitConversionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnitConversionError';
  }
}

/** Hours in one person-month for the given employee/month context. */
export function hoursPerPersonMonth(ctx: UnitConversionContext): number {
  if (ctx.workingDaysInMonth < 0) {
    throw new UnitConversionError('workingDaysInMonth must be non-negative');
  }
  return ctx.weeklyHours * (ctx.workingDaysInMonth / 5);
}

function requireCostPerPersonMonth(ctx: UnitConversionContext): number {
  if (ctx.costPerPersonMonth === undefined) {
    throw new UnitConversionError(
      'costPerPersonMonth is required when converting Cost display units',
    );
  }
  if (!(ctx.costPerPersonMonth >= 0)) {
    throw new UnitConversionError('costPerPersonMonth must be non-negative');
  }
  return ctx.costPerPersonMonth;
}

/**
 * Convert a display/edit value into canonical person-months.
 */
export function toCanonical(
  unit: DisplayUnit,
  displayValue: number,
  ctx: UnitConversionContext,
): number {
  switch (unit) {
    case 'PM':
      return displayValue;
    case 'Hours': {
      const hours = hoursPerPersonMonth(ctx);
      if (hours === 0) {
        throw new UnitConversionError('Cannot convert Hours when hours per PM is 0');
      }
      return displayValue / hours;
    }
    case 'Percent':
      return displayValue / 100;
    case 'Cost': {
      const costPerPm = requireCostPerPersonMonth(ctx);
      if (costPerPm === 0) {
        if (displayValue === 0) return 0;
        throw new UnitConversionError('Cannot convert Cost when costPerPersonMonth is 0');
      }
      return displayValue / costPerPm;
    }
    default: {
      const _exhaustive: never = unit;
      throw new UnitConversionError(`Unsupported display unit: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Convert canonical person-months into a display/edit value for the given unit.
 */
export function fromCanonical(
  unit: DisplayUnit,
  amountPm: number,
  ctx: UnitConversionContext,
): number {
  switch (unit) {
    case 'PM':
      return amountPm;
    case 'Hours':
      return amountPm * hoursPerPersonMonth(ctx);
    case 'Percent':
      return amountPm * 100;
    case 'Cost':
      return amountPm * requireCostPerPersonMonth(ctx);
    default: {
      const _exhaustive: never = unit;
      throw new UnitConversionError(`Unsupported display unit: ${String(_exhaustive)}`);
    }
  }
}
