import type { DisplayUnit } from '@bps/domain';

const UNITS: { unit: DisplayUnit; label: string }[] = [
  { unit: 'PM', label: 'PM' },
  { unit: 'Hours', label: 'Hours' },
  { unit: 'Percent', label: '%' },
  { unit: 'Cost', label: '€' },
];

interface UnitSwitcherProps {
  value: DisplayUnit;
  onChange: (unit: DisplayUnit) => void;
}

export function UnitSwitcher({ value, onChange }: UnitSwitcherProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="bps-meta" id="unit-switcher-label">
        Unit
      </span>
      <div
        className="bps-segment"
        role="group"
        aria-labelledby="unit-switcher-label"
      >
        {UNITS.map(({ unit, label }) => (
          <button
            key={unit}
            type="button"
            className="bps-segment__btn"
            aria-pressed={value === unit}
            onClick={() => onChange(unit)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
