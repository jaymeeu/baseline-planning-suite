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
 * People owns rates exclusively in bps-people; Delivery will consume via published contract (Phase 8).
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
    <section className="panel" aria-label="Rate history">
      <h2>Rate history</h2>
      <p className="muted">
        Effective-dated rates (`validFrom` inclusive, no end date). Retroactive
        dates are allowed. Ordered by validFrom.
      </p>
      <table className="rate-table">
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
              <td>{rate.validFrom}</td>
              <td>€{rate.hourlyCost.toFixed(2)}</td>
              <td>
                <button type="button" onClick={() => startEdit(rate)}>
                  Edit
                </button>{' '}
                <button
                  type="button"
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
      {rates.length === 0 ? <p className="muted">No rates yet.</p> : null}

      <h3>{editingId ? 'Edit rate' : 'Add rate'}</h3>
      <div className="form-row">
        <label htmlFor="rate-from">Valid from</label>
        <input
          id="rate-from"
          type="date"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label htmlFor="rate-cost">Hourly cost (€)</label>
        <input
          id="rate-cost"
          type="number"
          min={0}
          step="0.01"
          value={hourlyCost}
          onChange={(event) => setHourlyCost(event.target.value)}
        />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="form-actions">
        <button
          type="button"
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
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}
