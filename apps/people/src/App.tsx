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
        <div className="bps-panel" aria-busy="true">
          <div className="bps-skeleton mb-3 h-4 w-36" />
          <p className="bps-meta m-0">Loading People…</p>
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
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-[1100px] p-5"
      data-testid="people-app"
    >
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
              <p className="bps-meta m-0">
                Select an employee to view details, rates, and capacity.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
