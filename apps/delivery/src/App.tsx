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
          <div className="bps-skeleton mb-3 h-4 w-40" />
          <p className="bps-meta m-0">Loading Delivery…</p>
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
          {data.message}{' '}
          <button
            type="button"
            className="bps-btn bps-btn--ghost ml-2 h-auto px-0"
            onClick={data.clearMessage}
          >
            Dismiss
          </button>
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
            <section className="border border-neutral-300 bg-neutral-50 p-3">
              <p className="text-neutral-600">
                Select a project to view WBS and staffing.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
