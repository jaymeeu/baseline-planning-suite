import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { CapacityPanel } from './components/CapacityPanel';
import { EmployeeDetail } from './components/EmployeeDetail';
import { EmployeeList } from './components/EmployeeList';
import { RateHistory } from './components/RateHistory';
import { usePeopleData } from './hooks/usePeopleData';
import './styles.css';

export interface PeopleAppProps {
  host?: HostContext;
}

export function App({ host = DEFAULT_HOST_CONTEXT }: PeopleAppProps) {
  const data = usePeopleData();

  if (data.loading) {
    return (
      <main className="people-app">
        <p>Loading People…</p>
      </main>
    );
  }

  if (data.error) {
    return (
      <main className="people-app">
        <p className="error" role="alert">
          {data.error}
        </p>
      </main>
    );
  }

  return (
    <main className="people-app" data-testid="people-app">
      <header>
        <h1>People</h1>
        <p className="people-meta" data-testid="people-mode">
          Employee register · currency {host.currency} · {host.activeUser.name}
        </p>
      </header>

      <div className="people-layout">
        <EmployeeList
          employees={data.filtered}
          selectedId={data.selected?.id ?? null}
          oversubscribedIds={data.oversubscribedIds}
          query={data.query}
          onQueryChange={data.setQuery}
          onSelect={data.setSelectedId}
        />

        <div>
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
            <section className="panel">
              <p className="muted">Select an employee to view details, rates, and capacity.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
