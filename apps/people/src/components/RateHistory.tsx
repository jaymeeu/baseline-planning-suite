import { useEffect, useState } from 'react';
import type { RateRecord } from '@bps/domain';
import { BpsModal, ModalError, submitModalOnEnter } from './BpsModal';

interface RateHistoryProps {
  rates: readonly RateRecord[];
  onSave: (input: {
    id?: string;
    validFrom: string;
    hourlyCost: number;
  }) => Promise<void>;
  onDelete: (rateId: string) => Promise<void>;
}

const DEFAULT_FROM = '2025-01-01';
const DEFAULT_COST = '80';

type RateModal =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; rate: RateRecord }
  | { type: 'delete'; rate: RateRecord };

/**
 * Rate history for the selected employee.
 * People owns rates in bps-people; rate changes publish on BroadcastChannel via @bps/contracts.
 */
export function RateHistory({ rates, onSave, onDelete }: RateHistoryProps) {
  const [modal, setModal] = useState<RateModal>({ type: 'closed' });
  const [validFrom, setValidFrom] = useState(DEFAULT_FROM);
  const [hourlyCost, setHourlyCost] = useState(DEFAULT_COST);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const editing = modal.type === 'edit';
  const deleting = modal.type === 'delete';
  const formOpen = modal.type === 'add' || modal.type === 'edit';

  useEffect(() => {
    if (modal.type === 'add') {
      setValidFrom(DEFAULT_FROM);
      setHourlyCost(DEFAULT_COST);
      setError(null);
    } else if (modal.type === 'edit') {
      setValidFrom(modal.rate.validFrom);
      setHourlyCost(String(modal.rate.hourlyCost));
      setError(null);
    } else if (modal.type === 'delete') {
      setError(null);
    }
  }, [modal]);

  function closeModal(): void {
    setModal({ type: 'closed' });
    setError(null);
  }

  function submitSave(): void {
    if (modal.type !== 'add' && modal.type !== 'edit') return;
    setBusy(true);
    setError(null);
    void onSave({
      id: modal.type === 'edit' ? modal.rate.id : undefined,
      validFrom,
      hourlyCost: Number(hourlyCost),
    })
      .then(() => closeModal())
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Save failed'),
      )
      .finally(() => setBusy(false));
  }

  function submitDelete(): void {
    if (modal.type !== 'delete') return;
    const rateId = modal.rate.id;
    setBusy(true);
    setError(null);
    void onDelete(rateId)
      .then(() => closeModal())
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Delete failed'),
      )
      .finally(() => setBusy(false));
  }

  return (
    <section className="bps-panel" aria-label="Rate history">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="bps-section-title mb-1">Rate history</h2>
          <p className="bps-meta m-0">
            Effective-dated rates (<code>validFrom</code> inclusive, no end
            date). Retroactive dates are allowed.
          </p>
        </div>
        <button
          type="button"
          className="bps-btn bps-btn--primary bps-btn--sm"
          onClick={() => setModal({ type: 'add' })}
        >
          Add rate
        </button>
      </div>

      {rates.length === 0 ? (
        <p className="bps-meta mb-0 mt-3">
          No rates yet. Use <strong>Add rate</strong> so Delivery can price
          allocations.
        </p>
      ) : (
        <table className="bps-table mt-3">
          <thead>
            <tr>
              <th>Valid from</th>
              <th>Hourly cost</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="bps-data">{rate.validFrom}</td>
                <td className="bps-data">€{rate.hourlyCost.toFixed(2)}</td>
                <td className="text-right whitespace-nowrap">
                  <div className="inline-flex flex-wrap justify-end gap-1">
                    <button
                      type="button"
                      className="bps-btn bps-btn--ghost bps-btn--sm"
                      aria-label={`Edit rate from ${rate.validFrom}`}
                      onClick={() => setModal({ type: 'edit', rate })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="bps-btn bps-btn--danger bps-btn--sm"
                      aria-label={`Delete rate from ${rate.validFrom}`}
                      disabled={busy}
                      onClick={() => setModal({ type: 'delete', rate })}
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

      <BpsModal
        open={formOpen}
        title={
          editing
            ? `Edit rate — ${modal.rate.validFrom}`
            : 'Add rate'
        }
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="bps-btn bps-btn--ghost"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bps-btn bps-btn--primary"
              disabled={busy || validFrom.trim() === '' || hourlyCost.trim() === ''}
              onClick={submitSave}
            >
              {busy ? 'Saving…' : editing ? 'Update rate' : 'Add rate'}
            </button>
          </>
        }
      >
        <div className="bps-field mb-3">
          <label htmlFor="rate-from">Valid from</label>
          <input
            id="rate-from"
            className="bps-field__control"
            type="date"
            value={validFrom}
            autoFocus
            onChange={(event) => setValidFrom(event.target.value)}
          />
        </div>
        <div className="bps-field">
          <label htmlFor="rate-cost">Hourly cost (€)</label>
          <input
            id="rate-cost"
            className="bps-field__control bps-data"
            type="number"
            min={0}
            step="0.01"
            value={hourlyCost}
            onChange={(event) => setHourlyCost(event.target.value)}
            onKeyDown={submitModalOnEnter}
          />
        </div>
        <ModalError message={error} />
      </BpsModal>

      <BpsModal
        open={deleting}
        title="Delete rate"
        danger
        onClose={closeModal}
        footer={
          <>
            <button
              type="button"
              className="bps-btn bps-btn--ghost"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bps-btn bps-btn--danger"
              disabled={busy}
              autoFocus
              onClick={submitDelete}
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        {deleting ? (
          <p className="m-0 text-bps-ink">
            Delete the rate from <strong>{modal.rate.validFrom}</strong> at{' '}
            <strong>€{modal.rate.hourlyCost.toFixed(2)}</strong>/h? Delivery
            cost views will update when this change publishes.
          </p>
        ) : null}
        <ModalError message={error} />
      </BpsModal>
    </section>
  );
}
