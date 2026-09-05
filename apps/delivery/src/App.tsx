import {
  DEFAULT_HOST_CONTEXT,
  type HostContext,
} from '@bps/contracts';
import { ProjectList } from './components/ProjectList';
import { StaffingGrid } from './components/StaffingGrid';
import { WbsTree } from './components/WbsTree';
import { useDeliveryData } from './hooks/useDeliveryData';
import './index.css';

export interface DeliveryAppProps {
  host?: HostContext;
}

export function App({ host = DEFAULT_HOST_CONTEXT }: DeliveryAppProps) {
  const data = useDeliveryData();

  if (data.loading) {
    return (
      <main className="mx-auto max-w-[1200px] p-5">
        <div className="bps-panel" aria-busy="true">
          <div className="bps-skeleton-block">
            <div className="bps-skeleton h-5 w-36" />
            <div className="bps-skeleton h-3 w-64" />
            <div className="bps-skeleton h-24 w-full" />
          </div>
          <p className="bps-meta mb-0 mt-3">Loading Delivery…</p>
        </div>
      </main>
    );
  }

  if (data.error && data.projects.length === 0) {
    return (
      <main className="mx-auto max-w-[1200px] p-5">
        <div className="bps-alert bps-alert--error" role="alert">
          <strong>Delivery could not load</strong>
          {data.error}
          <p className="bps-meta mb-0 mt-2 text-bps-danger">
            Refresh the page or check that IndexedDB is available, then try
            again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="mx-auto max-w-[1200px] p-5"
      data-testid="delivery-app"
    >
      <header className="mb-4 border-b border-bps-line pb-3">
        <h1 className="bps-title mb-1">Delivery</h1>
        <p className="bps-meta m-0" data-testid="delivery-mode">
          Projects, WBS &amp; staffing · currency {host.currency} ·{' '}
          {host.activeUser.name}
        </p>
      </header>

      {data.message ? (
        <div className="bps-alert bps-alert--status mb-3" role="status">
          <div className="bps-alert__row">
            <span>{data.message}</span>
            <button
              type="button"
              className="bps-btn bps-btn--ghost bps-btn--sm"
              onClick={data.clearMessage}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(240px,320px)_1fr]">
        <ProjectList
          projects={data.projects}
          selectedId={data.selectedProjectId}
          onSelect={data.setSelectedProjectId}
          onSave={data.saveProject}
        />

        <div>
          {data.selectedProject ? (
            <>
              <WbsTree
                projectName={data.selectedProject.name}
                flat={data.wbsFlat}
                items={data.projectItems}
                onAddRoot={data.addRootItem}
                onAddChild={data.addChildItem}
                onRename={data.renameItem}
                onMove={data.moveItem}
                onDelete={data.deleteItem}
              />
              <StaffingGrid
                projectName={data.selectedProject.name}
                items={data.projectItems}
                wbsFlat={data.wbsFlat}
                allocations={data.allocations}
                employees={data.employees}
                rates={data.rates}
                selectedBreakdownId={data.selectedBreakdownId}
                selectedIsLeaf={data.selectedIsLeaf}
                selectedBreakdownName={data.selectedBreakdown?.name ?? null}
                onSelectBreakdown={data.setSelectedBreakdownId}
                displayUnit={data.displayUnit}
                onDisplayUnitChange={data.setDisplayUnit}
                capacityByEmployeeMonth={data.capacityByEmployeeMonth}
                onSaveAllocation={data.saveAllocation}
              />
            </>
          ) : (
            <section className="bps-panel">
              <h2 className="bps-section-title mb-2">No project selected</h2>
              <p className="bps-meta mb-0">
                Choose a project from the list to view its WBS and staffing
                grid.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
