import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { CapacityPanel } from './components/CapacityPanel';
import { EmployeeDetail } from './components/EmployeeDetail';
import { EmployeeList } from './components/EmployeeList';
import { RateHistory } from './components/RateHistory';
import { usePeopleData } from './hooks/usePeopleData';
import './index.css';

export interface PeopleAppProps {
  host?: HostContext;
}

export function App({ host = DEFAULT_HOST_CONTEXT }: PeopleAppProps) {
  const data = usePeopleData();

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1100px] p-5">
        <div className="bps-panel" aria-busy="true" aria-live="polite">
          <div className="bps-skeleton-block">
            <div className="bps-skeleton h-5 w-40" />
            <div className="bps-skeleton h-3 w-full max-w-md" />
            <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(240px,320px)_1fr]">
              <div className="bps-skeleton h-64 w-full" />
              <div className="bps-skeleton h-64 w-full" />
            </div>
          </div>
          <p className="bps-meta m-0 mt-3">Loading People…</p>
        </div>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="mx-auto max-w-[1100px] p-5">
        <div className="bps-alert bps-alert--error" role="alert">
          <strong>People could not load</strong>
          {data.error}
          <p className="bps-meta m-0 mt-2" style={{ color: 'inherit', opacity: 0.9 }}>
            Refresh the page. If this persists, clear site data for localhost and
            try again so the baseline fixture can re-seed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1100px] p-5" data-testid="people-app">
      <header className="mb-4 border-b border-bps-line pb-3">
        <h1 className="bps-title mb-1">People</h1>
        <p className="bps-meta m-0" data-testid="people-mode">
          Employee register · currency {host.currency} · {host.activeUser.name}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(240px,320px)_1fr]">
        <EmployeeList
          employees={data.filtered}
          selectedId={data.selected?.id ?? null}
          oversubscribedIds={data.oversubscribedIds}
          query={data.query}
          onQueryChange={data.setQuery}
          onSelect={data.setSelectedId}
        />

        <div className="space-y-4">
          {data.selected ? (
            <>
              <EmployeeDetail
                employee={data.selected}
                oversubscribed={data.oversubscribedIds.has(data.selected.id)}
                onSave={data.saveEmployee}
              />
              <RateHistory
                rates={data.selectedRates}
                onSave={data.saveRate}
                onDelete={data.deleteRate}
              />
              <CapacityPanel rows={data.selectedCapacity} />
            </>
          ) : (
            <section className="bps-panel">
              <h2 className="bps-section-title mb-2">Nothing selected</h2>
              <p className="bps-meta m-0">
                Select an employee in the register to view details, rates, and
                capacity across all projects.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
