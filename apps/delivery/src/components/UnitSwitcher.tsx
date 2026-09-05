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
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Display unit"
    >
      <span className="text-sm text-neutral-600">Unit:</span>
      {UNITS.map(({ unit, label }) => (
        <button
          key={unit}
          type="button"
          className={`cursor-pointer border px-3 py-1.5 text-sm ${
            value === unit
              ? 'border-neutral-900 bg-neutral-200 font-semibold'
              : 'border-neutral-400 bg-white'
          }`}
          aria-pressed={value === unit}
          onClick={() => onChange(unit)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
