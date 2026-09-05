import { useState } from 'react';
import type { RateRecord } from '@bps/domain';

interface RateHistoryProps {
  rates: readonly RateRecord[];
  onSave: (input: {
    id?: string;
    validFrom: string;
    hourlyCost: number;
  }) => Promise<void>;
  onDelete: (rateId: string) => Promise<void>;
}

/**
 * Rate history for the selected employee.
 * People owns rates in bps-people; rate changes publish on BroadcastChannel via @bps/contracts.
 */
export function RateHistory({ rates, onSave, onDelete }: RateHistoryProps) {
  const [validFrom, setValidFrom] = useState('2025-01-01');
  const [hourlyCost, setHourlyCost] = useState('80');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function startEdit(rate: RateRecord) {
    setEditingId(rate.id);
    setValidFrom(rate.validFrom);
    setHourlyCost(String(rate.hourlyCost));
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setValidFrom('2025-01-01');
    setHourlyCost('80');
    setError(null);
  }

  return (
    <section
      className="border border-neutral-300 bg-neutral-50 p-3"
      aria-label="Rate history"
    >
      <h2 className="mb-3 text-lg font-semibold">Rate history</h2>
      <p className="text-neutral-600">
        Effective-dated rates (`validFrom` inclusive, no end date). Retroactive
        dates are allowed. Ordered by validFrom.
      </p>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-neutral-300 px-2 py-1.5 text-left">
              Valid from
            </th>
            <th className="border border-neutral-300 px-2 py-1.5 text-left">
              Hourly cost
            </th>
            <th className="border border-neutral-300 px-2 py-1.5 text-left">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.id}>
              <td className="border border-neutral-300 px-2 py-1.5">
                {rate.validFrom}
              </td>
              <td className="border border-neutral-300 px-2 py-1.5">
                €{rate.hourlyCost.toFixed(2)}
              </td>
              <td className="border border-neutral-300 px-2 py-1.5">
                <button
                  type="button"
                  className="cursor-pointer border border-neutral-400 bg-white px-2 py-1"
                  onClick={() => startEdit(rate)}
                >
                  Edit
                </button>{' '}
                <button
                  type="button"
                  className="cursor-pointer border border-neutral-400 bg-white px-2 py-1"
                  onClick={() => {
                    setBusy(true);
                    void onDelete(rate.id)
                      .then(() => {
                        if (editingId === rate.id) resetForm();
                      })
                      .catch((err: unknown) =>
                        setError(
                          err instanceof Error ? err.message : 'Delete failed',
                        ),
                      )
                      .finally(() => setBusy(false));
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rates.length === 0 ? <p className="text-neutral-600">No rates yet.</p> : null}

      <h3 className="mt-4 text-base font-semibold">
        {editingId ? 'Edit rate' : 'Add rate'}
      </h3>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="rate-from">Valid from</label>
        <input
          id="rate-from"
          className="border border-neutral-300 px-2 py-1.5"
          type="date"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
        />
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <label htmlFor="rate-cost">Hourly cost (€)</label>
        <input
          id="rate-cost"
          className="border border-neutral-300 px-2 py-1.5"
          type="number"
          min={0}
          step="0.01"
          value={hourlyCost}
          onChange={(event) => setHourlyCost(event.target.value)}
        />
      </div>
      {error ? <p className="my-2 text-red-800">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5 disabled:opacity-50"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(null);
            void onSave({
              id: editingId ?? undefined,
              validFrom,
              hourlyCost: Number(hourlyCost),
            })
              .then(() => resetForm())
              .catch((err: unknown) =>
                setError(err instanceof Error ? err.message : 'Save failed'),
              )
              .finally(() => setBusy(false));
          }}
        >
          {editingId ? 'Update rate' : 'Add rate'}
        </button>
        {editingId ? (
          <button
            type="button"
            className="cursor-pointer border border-neutral-400 bg-white px-3 py-1.5"
            onClick={resetForm}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
