import { describe, expect, it } from 'vitest';
import {
  UnitConversionError,
  fromCanonical,
  hoursPerPersonMonth,
  toCanonical,
  type UnitConversionContext,
} from '../../packages/domain/src/index';

const TOLERANCE = 1e-10;

const march40: UnitConversionContext = {
  weeklyHours: 40,
  workingDaysInMonth: 22,
  costPerPersonMonth: 7880 / 0.5, // €15,760 per PM (matches 0.5 PM → €7,880)
};

describe('hoursPerPersonMonth', () => {
  it('supports 40h, 32h, and 20h with 22 working days', () => {
    expect(hoursPerPersonMonth({ weeklyHours: 40, workingDaysInMonth: 22 })).toBe(
      176,
    );
    expect(hoursPerPersonMonth({ weeklyHours: 32, workingDaysInMonth: 22 })).toBe(
      140.8,
    );
    expect(hoursPerPersonMonth({ weeklyHours: 20, workingDaysInMonth: 22 })).toBe(
      88,
    );
  });
});

describe('canonical PM conversions', () => {
  it('round-trips PM unchanged', () => {
    const pm = 0.5;
    expect(toCanonical('PM', fromCanonical('PM', pm, march40), march40)).toBe(pm);
  });

  it('round-trips Hours for 40h / 22 WD', () => {
    const pm = 0.5;
    const hours = fromCanonical('Hours', pm, march40);
    expect(hours).toBe(88);
    expect(toCanonical('Hours', hours, march40)).toBeCloseTo(pm, 10);
  });

  it('round-trips Percent (1 PM = 100%)', () => {
    const pm = 0.5;
    const percent = fromCanonical('Percent', pm, march40);
    expect(percent).toBe(50);
    expect(Math.abs(toCanonical('Percent', percent, march40) - pm)).toBeLessThan(
      TOLERANCE,
    );
  });

  it('round-trips Cost when costPerPersonMonth is provided', () => {
    const pm = 0.5;
    const cost = fromCanonical('Cost', pm, march40);
    expect(cost).toBe(7880);
    expect(Math.abs(toCanonical('Cost', cost, march40) - pm)).toBeLessThan(
      TOLERANCE,
    );
  });

  it('round-trips Hours for 32h and 20h', () => {
    const ctx32: UnitConversionContext = {
      weeklyHours: 32,
      workingDaysInMonth: 22,
    };
    const ctx20: UnitConversionContext = {
      weeklyHours: 20,
      workingDaysInMonth: 22,
    };
    const pm = 0.25;

    expect(
      Math.abs(
        toCanonical('Hours', fromCanonical('Hours', pm, ctx32), ctx32) - pm,
      ),
    ).toBeLessThan(TOLERANCE);

    expect(
      Math.abs(
        toCanonical('Hours', fromCanonical('Hours', pm, ctx20), ctx20) - pm,
      ),
    ).toBeLessThan(TOLERANCE);
  });

  it('rejects Cost conversion without costPerPersonMonth', () => {
    const ctx: UnitConversionContext = {
      weeklyHours: 40,
      workingDaysInMonth: 22,
    };
    expect(() => fromCanonical('Cost', 0.5, ctx)).toThrow(UnitConversionError);
    expect(() => toCanonical('Cost', 100, ctx)).toThrow(UnitConversionError);
  });
});
