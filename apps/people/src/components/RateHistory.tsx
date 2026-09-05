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
    <section className="bps-panel" aria-label="Rate history">
      <h2 className="bps-section-title mb-2">Rate history</h2>
      <p className="bps-meta mb-3">
        Effective-dated rates (<code>validFrom</code> inclusive, no end date).
        Retroactive dates are allowed. Ordered by validFrom.
      </p>
      {rates.length === 0 ? (
        <p className="bps-meta mb-3">
          No rates yet. Add one below so Delivery can price allocations.
        </p>
      ) : (
        <table className="bps-table mb-3">
          <thead>
            <tr>
              <th>Valid from</th>
              <th>Hourly cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="bps-data">{rate.validFrom}</td>
                <td className="bps-data">€{rate.hourlyCost.toFixed(2)}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="bps-btn bps-btn--secondary"
                      style={{ height: 30, paddingInline: 10 }}
                      onClick={() => startEdit(rate)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bps-btn bps-btn--ghost"
                      style={{ height: 30, paddingInline: 10 }}
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        void onDelete(rate.id)
                          .then(() => {
                            if (editingId === rate.id) resetForm();
                          })
                          .catch((err: unknown) =>
                            setError(
                              err instanceof Error
                                ? err.message
                                : 'Delete failed',
                            ),
                          )
                          .finally(() => setBusy(false));
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="bps-section-title mb-3 text-base">
        {editingId ? 'Edit rate' : 'Add rate'}
      </h3>
      <div className="bps-field mb-3">
        <label htmlFor="rate-from">Valid from</label>
        <input
          id="rate-from"
          className="bps-field__control"
          type="date"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
        />
      </div>
      <div className="bps-field mb-3">
        <label htmlFor="rate-cost">Hourly cost (€)</label>
        <input
          id="rate-cost"
          className="bps-field__control bps-data"
          type="number"
          min={0}
          step="0.01"
          value={hourlyCost}
          onChange={(event) => setHourlyCost(event.target.value)}
        />
      </div>
      {error ? (
        <div className="bps-alert bps-alert--error mb-3" role="alert">
          <strong>Could not save rate</strong>
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="bps-btn bps-btn--primary"
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
          {busy ? 'Saving…' : editingId ? 'Update rate' : 'Add rate'}
        </button>
        {editingId ? (
          <button
            type="button"
            className="bps-btn bps-btn--secondary"
            onClick={resetForm}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
